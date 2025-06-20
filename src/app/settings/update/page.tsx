"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { post } from "@/app/utils/apiClient";

export default function AdminLoginAndUpdate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [adminId, setAdminId] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loggingIn, setLoggingIn] = useState(false);
  const [updating, setUpdating] = useState(false);

  const showAlert = (icon: "success" | "error" | "warning", title: string, text: string) => {
    return Swal.fire({ icon, title, text, confirmButtonColor: icon === "success" ? "#16a34a" : "#dc2626" });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return showAlert("warning", "Missing Fields", "Please enter both email and password.");
    }
    setLoggingIn(true);
    try {
      const res = await post<{ success: boolean; message: string; data?: { adminId: string } }>(
        "/admin/login",
        { email, password }
      );

      if (res.success) {
        await showAlert("success", "Login Successful", res.message);
        setAdminId(res.data?.adminId || "");
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      console.error(err);
      await showAlert("error", "Login Failed", err.message || "Unable to login.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleUpdate = async () => {
    if (!adminId) {
      return showAlert("warning", "Not Logged In", "Please login before updating.");
    }
    if (!newEmail && !newPassword) {
      return showAlert("warning", "No Changes", "Enter new email and/or password to update.");
    }

    setUpdating(true);
    try {
      const payload: Record<string, string> = { adminId };
      if (newEmail) payload.email = newEmail;
      if (newPassword) payload.password = newPassword;

      const res = await post<{ success: boolean; message: string }>(
        "/admin/update",
        payload
      );

      if (res.success) {
        await showAlert("success", "Update Successful", res.message);
        // clear fields
        setNewEmail("");
        setNewPassword("");
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      console.error(err);
      await showAlert("error", "Update Failed", err.message || "Unable to update details.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center items-center min-h-screen bg-gray-50"
    >
      <Card className="w-full max-w-lg shadow-xl">
        <CardContent className="p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center text-blue-700">Admin Portal</h1>

          {/* — LOGIN SECTION — */}
          <div className="space-y-4">
            <Label htmlFor="email">Email / Username</Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email or Username"
              disabled={loggingIn || updating}
            />

            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loggingIn || updating}
            />

            <Button
              onClick={handleLogin}
              disabled={loggingIn || updating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="animate-spin w-4 h-4" /> Logging in...
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </div>

          <hr className="my-4" />

          {/* — UPDATE SECTION — */}
          <h2 className="text-lg font-semibold text-center">Update Admin Details</h2>
          <div className="space-y-4">
            <Label htmlFor="newEmail">New Email</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="New Email"
              disabled={!adminId || updating}
            />

            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New Password"
              disabled={!adminId || updating}
            />

            <Button
              onClick={handleUpdate}
              disabled={!adminId || updating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {updating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="animate-spin w-4 h-4" /> Updating...
                </span>
              ) : (
                "Update Admin"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
