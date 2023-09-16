"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import Table2 from "./Table";
import { log } from "console";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function Home() {
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const isLoading = useRef(false);
  const permis = useRef(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [recordingStatus, setRecordingStatus] = useState("inactive");
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audio, setAudio] = useState<string | null>(null);
  const [csvText, setcsvText] = useState<string[]>([]);
  const [recordedText, setrecordedText] = useState<string>();
  const [, updateState] = React.useState<any>();
  const forceUpdate = React.useCallback(() => updateState({}), []);
  const mimeType: MediaRecorderOptions = {
    mimeType: "audio/webm",
  };
  const blobPropertyTag: BlobPropertyBag = {
    type: "audio/webm",
  };

  const convertRecording = async (text: string) => {
    const apiUrl = "https://api.openai.com/v1/completions";
    const body = {
      model: "text-davinci-003",
      prompt: `Prompt: Complete the following financial transaction:\n ${text} \nParticulars: {Particulars_Value}\nFinance Category: {Finance_Category_Value} Expense/Revenue/Asset/Liability\nTransaction Amount: {Transaction_Amount_Value_in_Rupees}\nNature of Transaction: {Nature_of_Transaction_Value} Credit/Debit from my perspective\nInput Status :{If_Input_is_a_financial_Transaction} true/false\n`,
      temperature: 0.1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };
    const accessToken = "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";
    isLoading.current = true;
    await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        // Any other headers you need to include can be added here
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle the API response
        console.log("Completion API Response:", data);
        const rows = data.choices[0].text.trim().split("\n");
        let result = "";
        let text = csvText;
        rows.map((x: string) => (result = result + x.split(":")[1] + ";"));
        text.push(result);
        setcsvText(text);
        isLoading.current = false;
        forceUpdate();
      })
      .catch((error) => {
        // Handle errors
        console.error("Error:", error);
        isLoading.current = false;
      });
  };

  const sendRecording = async (audioBlob: Blob) => {
    const formData = new FormData();
    const apiUrl = "https://api.openai.com/v1/audio/transcriptions";
    formData.append("model", "whisper-1");
    formData.append("temperature", "0.1");
    formData.append("language", "en");
    formData.append("file", audioBlob, "recorded_audio.webm");
    const accessToken = "";
    isLoading.current = true;
    // Send the POST request using fetch
    await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle the API response
        console.log("API Response:", data);
        convertRecording(data.text);
        setrecordedText(data.text);
        isLoading.current = false;
      })
      .catch((error) => {
        // Handle errors
        console.error("Error:", error);
        isLoading.current = false;
      });
    forceUpdate();
  };
  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        permis.current = true;
        setStream(streamData);
        forceUpdate();
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      alert("The MediaRecorder API is not supported in your browser.");
    }
  };

  const startRecording = async () => {
    if (!permis.current) {
      await getMicrophonePermission();
      console.log("Checkpoint 1");
    }
    console.log(permis.current);
    if (permis.current) {
      console.log("Checkpoint 2");
      setRecordingStatus("recording");

      forceUpdate();
      //create new Media recorder instance using the stream
      const media = stream && new MediaRecorder(stream, mimeType);
      console.log(stream);
      //set the MediaRecorder instance to the mediaRecorder ref
      mediaRecorder.current = media;
      //invokes the start method to start the recording process
      if (mediaRecorder.current) {
        mediaRecorder.current.start();
        let localAudioChunks: Blob[] = [];
        mediaRecorder.current.ondataavailable = (event) => {
          if (typeof event.data === "undefined") return;
          if (event.data.size === 0) return;
          localAudioChunks.push(event.data);
        };
        setAudioChunks(localAudioChunks);
      }
    }
  };

  const stopRecording = () => {
    setRecordingStatus("inactive");
    //stops the recording instance
    if (mediaRecorder.current) {
      mediaRecorder.current?.stop();
      mediaRecorder.current.onstop = () => {
        //creates a blob file from the audiochunks data
        const audioBlob = new Blob(audioChunks, blobPropertyTag);
        //creates a playable URL from the blob file.
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudio(audioUrl);
        setAudioChunks([]);
        sendRecording(audioBlob);

        forceUpdate();
      };
    }
  };

  return (
    <main className="flex min-h-screen max-w-6xl w-full mx-auto flex-col items-center justify-between p-24">
      <div className="w-full">
        <h2 className="text-4xl font-semibold">
          Echobooks -{" "}
          <span className="text-2xl font-medium">
            {" "}
            Advance AI Speech-Recognition
          </span>
        </h2>
        <h2 className="">UI Test</h2>
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            {recordingStatus === "inactive" ? (
              <Button onClick={startRecording}>Start Recording</Button>
            ) : null}
            {permission && recordingStatus === "recording" ? (
              <Button onClick={stopRecording} variant="secondary">
                Stop Recording
              </Button>
            ) : null}
            {isLoading.current ? (
              // <Button>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : // </Button>
            null}
            {audio ? (
              <div className="audio-container">
                {/* <audio src={audio} controls></audio>
            <a download href={audio}>
              Download Recording
            </a> */}
                Audio Recorded!
              </div>
            ) : null}
            {/* {csvText ? <CSVTable csvText={csvText} /> : null} */}
          </div>
          {recordedText ? (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Recorded Audio</AlertTitle>
              <AlertDescription>{recordedText}</AlertDescription>
            </Alert>
          ) : null}

          <Table2 text={csvText}></Table2>
          {/* {csvText.map((x, index) => (
            <div key={index}>{x}</div>
          ))} */}
        </div>
      </div>
    </main>
  );
}
