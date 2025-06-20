"use client";

import React, { Suspense } from "react";
import AddEditEmployeePage from "./AddEditEmployeeForm";


export default function AddEdit() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading form…</div>}>
      <AddEditEmployeePage />
    </Suspense>
  );
}