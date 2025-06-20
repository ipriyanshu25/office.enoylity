"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// ← import your shared wrappers
import { get, post } from "@/app/utils/apiClient";

interface CompanyInfo {
  company_title: string;
  company_name: string;
  address_line1: string;
  address_line2: string;
}

interface FormData {
  settings_id: string;
  company_info: CompanyInfo;
}

export default function UpdateSalarySettings() {
  const [formData, setFormData] = useState<FormData>({
    settings_id: "",
    company_info: {
      company_title: "",
      company_name: "",
      address_line1: "",
      address_line2: "",
    },
  });
  const [loading, setLoading] = useState(false);

  const showAlert = (
    type: "success" | "error" | "warning",
    title: string,
    text: string
  ) => {
    Swal.fire({
      icon: type,
      title,
      text,
      confirmButtonColor: type === "success" ? "#16a34a" : "#dc2626",
    });
  };

  // 1️⃣ Fetch settings once on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await get<{
          success: boolean;
          message?: string;
          data: {
            settings_id: string;
            company_info: CompanyInfo;
          };
        }>("/settings/salary");

        if (res.success) {
          setFormData({
            settings_id: res.data.settings_id,
            company_info: res.data.company_info,
          });
        } else {
          showAlert("error", "Fetch Failed", res.message || "Could not load settings.");
        }
      } catch (err: any) {
        console.error(err);
        showAlert("error", "Network Error", "Unable to load settings. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2️⃣ Handle field updates
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      company_info: { ...prev.company_info, [name]: value },
    }));
  };

  // 3️⃣ Submit updated settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await post<{
        success: boolean;
        message?: string;
      }>("/settings/salary", formData);

      if (res.success) {
        showAlert("success", "Updated", res.message || "Settings updated successfully!");
      } else {
        showAlert("error", "Update Failed", res.message || "Could not update settings.");
      }
    } catch (err: any) {
      console.error(err);
      showAlert(
        "error",
        "Network Error",
        err.message || "An error occurred while updating. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // 4️⃣ Render
  const fields = [
    { id: "company_title", name: "company_title", label: "Company Title" },
    { id: "company_name", name: "company_name", label: "Company Name" },
    { id: "address_line1", name: "address_line1", label: "Address Line 1" },
    { id: "address_line2", name: "address_line2", label: "Address Line 2" },
  ] as const;

  return (
    <Card className="max-w-xl mx-auto mt-10">
      <CardContent className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Salary Slip Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ id, name, label }) => (
            <div key={id}>
              <Label htmlFor={id}>{label}</Label>
              <Input
                id={id}
                name={name}
                value={formData.company_info[name]}
                onChange={handleChange}
                placeholder={label}
                disabled={loading}
                required
              />
            </div>
          ))}

          <div className="flex">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Updating..." : "Update Details"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
