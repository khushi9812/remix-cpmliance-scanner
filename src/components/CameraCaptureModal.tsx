import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  CameraOff,
  Flashlight,
  RefreshCw,
  X,
} from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(true);
  const [isShutterActive, setIsShutterActive] = useState<boolean>(false);

  // Stop camera helper
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Enumerate video devices
  const updateDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoInputs);
    } catch {
      // ignore
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    if (!isOpen) return;

    setIsStarting(true);
    setError(null);
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("In-browser MediaDevices camera access is not supported by your browser or environment.");
      setIsStarting(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }

      // Check capabilities (torch)
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        setHasTorch(Boolean(capabilities.torch));
      }

      await updateDeviceList();
      setIsStarting(false);
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      let message = "Could not start camera feed.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Camera access was denied. Please allow camera permissions in your browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "No camera device detected on this system.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        message = "Camera is currently in use by another application or tab.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setIsStarting(false);
    }
  }, [isOpen, selectedDeviceId, facingMode, stopStream, updateDeviceList]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn("Torch toggle failed:", err);
    }
  };

  // Flip Camera (environment <-> user)
  const flipCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setSelectedDeviceId(devices[nextIndex].deviceId);
    } else {
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    }
  };

  // Capture current video frame into a File
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Visual shutter feedback
    setIsShutterActive(true);

    // Draw native frame
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        setIsShutterActive(false);
        if (!blob) return;

        const capturedFile = new File(
          [blob],
          `label-scan-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        // Stop stream cleanly and emit
        stopStream();
        onCapture(capturedFile);
        onClose();
      },
      "image/jpeg",
      0.95
    );
  };

  // Effect: Start/stop based on isOpen
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/30 text-blue-400">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">
                Live Packaging Label Viewfinder
              </h3>
              <p className="text-[11px] text-slate-400">
                MediaDevices High-Resolution Camera Capture
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close camera"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Viewport / Canvas Container */}
        <div className="relative flex min-h-[380px] w-full flex-1 items-center justify-center overflow-hidden bg-black sm:min-h-[440px]">
          {/* Shutter White Flash Animation */}
          {isShutterActive && (
            <div className="pointer-events-none absolute inset-0 z-30 bg-white transition-opacity duration-150 animate-out fade-out" />
          )}

          {/* Live Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full max-h-[65vh] w-full object-contain ${
              facingMode === "user" ? "scale-x-[-1]" : ""
            }`}
          />

          {/* Overlay Framing Reticle */}
          {!error && !isStarting && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="relative h-[80%] w-[88%] max-w-lg rounded-xl border-2 border-dashed border-blue-400/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* Visual Corner Brackets */}
                <div className="absolute -left-1 -top-1 h-6 w-6 border-l-4 border-t-4 border-blue-400 rounded-tl-md" />
                <div className="absolute -right-1 -top-1 h-6 w-6 border-r-4 border-t-4 border-blue-400 rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-4 border-l-4 border-blue-400 rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-4 border-r-4 border-blue-400 rounded-br-md" />

                {/* Center alignment guide */}
                <div className="absolute inset-0 flex flex-col items-center justify-between p-3 text-center">
                  <Badge
                    variant="outline"
                    className="border-blue-400/40 bg-slate-900/80 text-[10px] font-semibold text-blue-300 backdrop-blur-xs"
                  >
                    Align product label inside frame
                  </Badge>

                  <p className="text-[11px] font-medium text-slate-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    Keep MRP, Net Qty &amp; Manufacturer text sharp &amp; well-lit
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isStarting && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 p-4 text-center text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-xs font-medium text-slate-300">
                Initializing camera feed via MediaDevices API…
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/90 p-6 text-center text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 ring-8 ring-rose-500/10">
                <CameraOff className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Camera Access Issue</h4>
              <p className="max-w-md text-xs leading-relaxed text-slate-400">{error}</p>
              <div className="flex gap-2 pt-2">
                <Button
                  id="retry-camera-btn"
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="h-8 gap-1.5 border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </Button>
                <Button
                  id="close-camera-error-btn"
                  size="sm"
                  onClick={onClose}
                  className="h-8 bg-blue-600 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Use File Upload
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-2">
            {/* Flip / Switch Camera Button */}
            <Button
              id="switch-camera-btn"
              type="button"
              variant="outline"
              size="sm"
              disabled={isStarting || Boolean(error)}
              onClick={flipCamera}
              className="h-9 gap-1.5 border-slate-700 bg-slate-800/80 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Flip Camera</span>
            </Button>

            {/* Torch Toggle if supported */}
            {hasTorch && (
              <Button
                id="toggle-torch-btn"
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleTorch}
                className={`h-9 gap-1.5 border-slate-700 text-xs ${
                  torchOn
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                    : "bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                }`}
              >
                <Flashlight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{torchOn ? "Torch On" : "Torch Off"}</span>
              </Button>
            )}
          </div>

          {/* Central Shutter Button */}
          <button
            id="shutter-capture-btn"
            type="button"
            disabled={isStarting || Boolean(error)}
            onClick={capturePhoto}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/80 bg-blue-600 shadow-lg transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            aria-label="Take Photo"
          >
            <div className="h-6 w-6 rounded-full bg-white transition-all group-hover:scale-90" />
          </button>

          {/* Cancel / Close */}
          <Button
            id="cancel-camera-btn"
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="h-9 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
