"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { get, post } from "@/app/utils/apiClient";

type CompanyInfo = Record<string, string>;

type EditableFields = {
  company_info?: CompanyInfo;
  bank_details?: CompanyInfo;
  paypal_details?: CompanyInfo;
  [key: string]: CompanyInfo | undefined;
};

type Settings = {
  settings_id: string;
  invoice_type: string;
  editable_fields: EditableFields;
};

export default function InvoiceSettingsPage() {
  const [settingsList, setSettingsList] = useState<Settings[]>([]);
  const [selected, setSelected] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);

  // 1️⃣ Load all available settings types
  useEffect(() => {
    (async () => {
      try {
        const res = await get<{ data: Settings[] }>("settings/getlist");
        setSettingsList(res.data || []);
      } catch {
        Swal.fire("Error", "Could not fetch settings list.", "error");
      }
    })();
  }, []);

  // 2️⃣ Whenever the list arrives, auto-select the first
  useEffect(() => {
    if (settingsList.length > 0 && !selected) {
      loadSettings(settingsList[0].settings_id);
    }
  }, [settingsList]);

  // Fetch a single settings object by ID
  const loadSettings = async (id: string) => {
    setLoading(true);
    try {
      const res = await get<{ data: Settings }>("settings/invoice", { settings_id: id });
      setSelected(res.data);
    } catch {
      Swal.fire("Error", "Failed to load settings for that type.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update a single field in the selected settings
  const handleFieldChange = (
    section: keyof EditableFields,
    field: string,
    value: string
  ) => {
    if (!selected) return;
    setSelected({
      ...selected,
      editable_fields: {
        ...selected.editable_fields,
        [section]: {
          ...selected.editable_fields[section],
          [field]: value,
        },
      },
    });
  };

  // Save the current `selected` back to the server
  const handleSave = async () => {
    if (!selected) return;
    setLoading(true);

    // Build payload: include settings_id plus each editable section
    const payload: any = { invoice_type: selected.invoice_type };
    for (const [section, data] of Object.entries(selected.editable_fields)) {
      if (data) payload[section] = data;
    }

    try {
      const res = await post<{ message?: string }>("settings/invoice", payload);
      Swal.fire("Saved", res.message || "Invoice settings updated.", "success");
    } catch {
      Swal.fire("Error", "Failed to update invoice settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <Card>
        <CardContent className="space-y-6">
          <h1 className="text-2xl font-semibold">Invoice Settings</h1>

          {/* Settings selector */}
          <div>
            <Label htmlFor="settings-select">Invoice Type</Label>
            <select
              id="settings-select"
              className="mt-1 w-full border rounded px-3 py-2"
              disabled={loading}
              value={selected?.settings_id || ""}
              onChange={(e) => loadSettings(e.target.value)}
            >
              {settingsList.map((s) => (
                <option key={s.settings_id} value={s.settings_id}>
                  {s.invoice_type}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic form */}
          {selected &&
            Object.entries(selected.editable_fields).map(
              ([sectionKey, fields]) =>
                fields && (
                  <div key={sectionKey} className="pt-4">
                    <h2 className="text-lg font-medium mb-2">
                      {sectionKey
                        .split("_")
                        .map((w) => w[0].toUpperCase() + w.slice(1))
                        .join(" ")}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(fields).map(([field, val]) => (
                        <div key={field}>
                          <Label htmlFor={`${sectionKey}-${field}`}>
                            {field
                              .split("_")
                              .map((w) => w[0].toUpperCase() + w.slice(1))
                              .join(" ")}
                          </Label>
                          <Input
                            id={`${sectionKey}-${field}`}
                            name={field}
                            value={val}
                            disabled={loading}
                            onChange={(e) =>
                              handleFieldChange(
                                sectionKey as keyof EditableFields,
                                field,
                                e.target.value
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}

          {/* Save */}
          <div className="pt-6">
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
