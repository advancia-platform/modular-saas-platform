"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface Message {
  id: string;
  consultationId: string;
  senderId: string;
  senderType: "PATIENT" | "DOCTOR";
  content: string;
  createdAt: string;
}

interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  status: string;
  symptoms: string;
  diagnosis?: string;
  createdAt: string;
  patient: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  doctor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  messages: Message[];
}

export default function ConsultationPage() {
  const params = useParams();
  const consultationId = params?.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [showVideo, setShowVideo] = useState(false);

  const fetchConsultation = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first");
      }

      const res = await fetch(`${apiUrl}/api/consultation/${consultationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConsultation(data.consultation);
      setMessages(data.consultation.messages || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch consultation";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    if (consultationId) {
      fetchConsultation();
    }
  }, [consultationId, fetchConsultation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first");
      }

      const res = await fetch(`${apiUrl}/api/consultation/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          consultationId,
          content: newMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Add new message to list
      setMessages([...messages, data.message]);
      setNewMessage("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message";
      alert(errorMessage);
    }
  };

  const handleStartVideo = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first");
      }

      const res = await fetch(
        `${apiUrl}/api/consultation/video/${consultationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVideoUrl(data.videoUrl);
      setShowVideo(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start video";
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading consultation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Consultation not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Consultation Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Consultation Details
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-medium text-gray-900">
                {consultation.patient.firstName} {consultation.patient.lastName}
              </p>
              <p className="text-sm text-gray-600">
                {consultation.patient.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Doctor</p>
              <p className="font-medium text-gray-900">
                Dr. {consultation.doctor.firstName}{" "}
                {consultation.doctor.lastName}
              </p>
              <p className="text-sm text-gray-600">
                {consultation.doctor.specialization}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  consultation.status === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : consultation.status === "IN_PROGRESS"
                    ? "bg-blue-100 text-blue-800"
                    : consultation.status === "CANCELLED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {consultation.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Symptoms</p>
              <p className="text-gray-900">{consultation.symptoms}</p>
            </div>
            {consultation.diagnosis && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Diagnosis</p>
                <p className="text-gray-900">{consultation.diagnosis}</p>
              </div>
            )}
          </div>

          {/* Video Button */}
          <div className="mt-6">
            <button
              onClick={handleStartVideo}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {showVideo ? "Hide Video" : "Start Video Call"}
            </button>
          </div>
        </div>

        {/* Video Container */}
        {showVideo && videoUrl && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Video Call</h2>
              <button
                onClick={() => setShowVideo(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕ Close
              </button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={videoUrl}
                allow="camera; microphone; fullscreen; display-capture"
                className="w-full h-full"
                title="Video Consultation"
              />
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Chat Messages
          </h2>

          {/* Messages List */}
          <div className="border rounded-lg p-4 mb-4 h-96 overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderType === "DOCTOR"
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.senderType === "DOCTOR"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-green-100 text-green-900"
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1">
                        {msg.senderType === "DOCTOR" ? "Doctor" : "Patient"}
                      </p>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
