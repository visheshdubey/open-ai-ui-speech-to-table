import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Table2 = ({ text }: { text: string[] }) => {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[240px]">Particular</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="w-[150px] ">Amount</TableHead>
          <TableHead className="w-[100px] ">Credit/Debit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {text.map((x, index) => {
          const elem = x.split(";");
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{elem[0]}</TableCell>
              <TableCell>{elem[1]}</TableCell>
              <TableCell>{elem[2]}</TableCell>
              <TableCell className="text-right">{elem[3]}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default Table2;
