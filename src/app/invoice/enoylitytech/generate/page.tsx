import React, { Suspense } from "react";
import GenerateInvoicePage from "./GenerateInvoice";

const Page = () => {
  return (
    <Suspense fallback={<div className="p-4">Loading invoice form...</div>}>
      <GenerateInvoicePage />
    </Suspense>
  );
};

export default Page;
