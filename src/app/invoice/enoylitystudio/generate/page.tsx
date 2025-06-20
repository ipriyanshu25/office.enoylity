import React, { Suspense } from "react";
import GenerateInvoiceClient from "./GenerateInvoiceClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GenerateInvoiceClient />
    </Suspense>
  );
}
