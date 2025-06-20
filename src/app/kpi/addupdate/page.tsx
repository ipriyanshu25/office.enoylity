"use client";

import React, { Suspense } from "react";
import Addupdatekpi from "./addupdatekpi";


export default function AddEdit() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading form…</div>}>
      <Addupdatekpi />
    </Suspense>
  );
}