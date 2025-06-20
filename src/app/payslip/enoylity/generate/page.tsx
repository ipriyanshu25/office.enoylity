"use client";

import React, { Suspense } from "react";
import GeneratePayslip from "./GeneratePayslip";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading payslip…</div>}>
      <GeneratePayslip />
    </Suspense>
  );
}
