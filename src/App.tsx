/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  Calendar,
  Plus,
  Clipboard,
  Check,
  AlertTriangle,
  Fuel,
  DollarSign,
  Package,
  Shield,
  Trash2,
  Search,
  Printer,
  User,
  Weight,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  ArrowLeftRight,
  RefreshCw,
  Copy
} from "lucide-react";
import { TripInput, TripBriefing, SavedTrip } from "./types";
import { TRIP_PRESETS, VEHICLE_OPTIONS } from "./data";

export default function App() {
  // Input fields state
  const [formData, setFormData] = useState<TripInput>({
    tripId: "TRP-8802",
    driverName: "Robert Carter",
    vehicleType: "Semi-Truck (Class 8 Diesel Reefer)",
    cargoType: "Fresh Refrigerated Berries",
    cargoWeight: "36,000 lbs",
    pickupLocation: "Salinas Valley Cold Storage, CA",
    deliveryLocation: "Seattle Distribution Center, WA",
    departureTime: "2026-06-01T06:00",
    estimatedDistance: "960 Miles",
    specialInstructions: "Cold chain control: Maintain standard temperature at 34°F. Continuous tracker on. Avoid secondary route bypasses due to steep mountain passes."
  });

  // Current generated briefing state
  const [briefing, setBriefing] = useState<TripBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Local persistent history state
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  // Driver Interactive Checklist State (keeps driver engaged with challenges and safety safety rules)
  const [checkedChallenges, setCheckedChallenges] = useState<Record<number, boolean>>({});
  const [checkedSafety, setCheckedSafety] = useState<Record<number, boolean>>({});
  const [copiedStatus, setCopiedStatus] = useState(false);

  // Auto-generate helper
  const regenerateTripId = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, tripId: `TRP-${num}` }));
  };

  // Swap pickup & delivery location helper
  const swapLocations = () => {
    setFormData(prev => ({
      ...prev,
      pickupLocation: prev.deliveryLocation,
      deliveryLocation: prev.pickupLocation
    }));
  };

  // Load saved trips on mount
  useEffect(() => {
    const list = localStorage.getItem("logistics_trips");
    if (list) {
      try {
        setSavedTrips(JSON.parse(list));
      } catch (e) {
        console.error("Failed to parse saved logistics trips", e);
      }
    }
  }, []);

  // Quick preset loader
  const loadPreset = (preset: typeof TRIP_PRESETS[0]) => {
    setFormData(preset.data);
    // Clear current briefing output if they load a new preset, to prevent confusion
    setBriefing(null);
    setErrorMessage(null);
    setCheckedChallenges({});
    setCheckedSafety({});
  };

  // REST API trigger
  const handleGenerateBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setBriefing(null);
    setCheckedChallenges({});
    setCheckedSafety({});

    try {
      const response = await fetch("/api/generate-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status code ${response.status}`);
      }

      const result: TripBriefing = await response.json();
      setBriefing(result);

      // Automatically persist to Local History
      const newSavedItem: SavedTrip = {
        id: `local-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        input: { ...formData },
        briefing: result
      };

      const updatedList = [newSavedItem, ...savedTrips];
      setSavedTrips(updatedList);
      localStorage.setItem("logistics_trips", JSON.stringify(updatedList));
      setSelectedSavedId(newSavedItem.id);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to contact logistics surveyor API. Please check your network or key configurations.");
    } finally {
      setLoading(false);
    }
  };

  // Reload an archive item
  const handleLoadSavedTrip = (saved: SavedTrip) => {
    setFormData(saved.input);
    setBriefing(saved.briefing);
    setSelectedSavedId(saved.id);
    setErrorMessage(null);
    setCheckedChallenges({});
    setCheckedSafety({});
  };

  // Delete saved trip
  const handleDeleteSavedTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedTrips.filter(t => t.id !== id);
    setSavedTrips(updated);
    localStorage.setItem("logistics_trips", JSON.stringify(updated));
    if (selectedSavedId === id) {
      setSelectedSavedId(null);
      setBriefing(null);
    }
  };

  // Filter list
  const filteredSavedTrips = savedTrips.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.input.tripId.toLowerCase().includes(query) ||
      item.input.driverName.toLowerCase().includes(query) ||
      item.input.pickupLocation.toLowerCase().includes(query) ||
      item.input.deliveryLocation.toLowerCase().includes(query) ||
      item.input.cargoType.toLowerCase().includes(query)
    );
  });

  // Export copyable text layout specified by prompt
  const getPromptFormattedText = () => {
    if (!briefing) return "";
    return `🚚 TRIP SUMMARY REPORT

Trip ID: ${formData.tripId || "N/A"}
Vehicle Type: ${formData.vehicleType || "N/A"}
Driver: ${formData.driverName || "N/A"}

📍 Route Overview
${briefing.routeOverview}

🛣 Route Notes
${briefing.routeNotes}

⚠ Expected Challenges
${briefing.expectedChallenges.map(c => `- ${c}`).join("\n")}

⛽ Fuel Planning
${briefing.fuelPlanning}

💰 Toll Notes
${briefing.tollNotes}

📦 Delivery Instructions
${briefing.deliveryInstructions}

🦺 Safety Recommendations
${briefing.safetyRecommendations.map(s => `- ${s}`).join("\n")}

📊 Operations Readiness
Trip Complexity: ${briefing.tripComplexity}

✅ Final Summary
${briefing.finalSummary}`;
  };

  const handleCopyToClipboard = () => {
    const rawText = getPromptFormattedText();
    navigator.clipboard.writeText(rawText);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Compute stats
  const totalReportsGenerated = savedTrips.length;
  const highComplexityCount = savedTrips.filter(t => t.briefing.tripComplexity === "High").length;
  const easyComplexityCount = savedTrips.filter(t => t.briefing.tripComplexity === "Easy").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Top Professional Dispatch Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 shrink-0 no-print">
        <div className="max-w-[1600px] mx-auto px-4 py-4 md:py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-teal-500 text-slate-950 p-2.5 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/10">
              <Truck className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-white">
                  VoyageSurveyor
                </h1>
                <span className="bg-teal-500/15 text-teal-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-teal-500/30">
                  AI Dispatch v3.5
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                Logistics Route Planning & Real-time Intelligent Driver Briefings
              </p>
            </div>
          </div>

          {/* Quick Metrics display bar */}
          <div className="flex items-center gap-3 md:gap-6 text-sm text-slate-300 bg-slate-900/60 p-2 px-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <span>
                System Target Time: <strong className="text-white font-mono font-medium">May 29, 2026</strong>
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-teal-400" />
              <span>
                DB Registry: <strong className="text-white font-mono">{totalReportsGenerated} Briefs</strong>
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Preset Fast Loading Bar */}
      <section className="bg-slate-900 text-white border-y border-slate-800 px-4 py-3 no-print">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-400 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Immediate Scenario Presets:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {TRIP_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadPreset(preset)}
                className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-700/80 text-slate-200 border border-slate-700/60 rounded-lg py-1.5 px-3 transition-all cursor-pointer font-medium tracking-wide grow lg:grow-0"
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 ml-auto lg:ml-1" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="grow max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print-container">
        
        {/* LEFT COLUMN: Input Form and Storage Registry (Columns 1 to 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 no-print">

          {/* Core Input Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-7 w-1 bg-teal-600 rounded"></div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  New Trip Parameters
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Step 1 of 2
              </span>
            </div>

            <form onSubmit={handleGenerateBriefing} className="space-y-4">
              
              {/* Trip ID & Driver Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                    <span>Trip ID *</span>
                    <button
                      type="button"
                      onClick={regenerateTripId}
                      className="text-[11px] text-teal-600 hover:text-teal-800 font-medium normal-case flex items-center gap-0.5 tab-focus"
                      title="Generate new Trip ID"
                    >
                      <RefreshCw className="h-3 w-3" /> Auto-Gen
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tripId}
                    onChange={e => setFormData({ ...prev => prev, tripId: e.target.value })}
                    placeholder="e.g. TRP-5192"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>Driver Name</span>
                  </label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={e => setFormData({ ...prev => prev, driverName: e.target.value })}
                    placeholder="Enter driver's name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Pickup & Delivery Location fields with quick swap helper button */}
              <div className="relative space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    <span>Pickup Location (Start) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pickupLocation}
                    onChange={e => setFormData({ ...prev => prev, pickupLocation: e.target.value })}
                    placeholder="City, State, Warehouse Hub"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Swap button placed neatly in between */}
                <div className="flex justify-center -my-1.5">
                  <button
                    type="button"
                    onClick={swapLocations}
                    className="bg-white border border-slate-200 rounded-full p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 shadow-sm transition-transform hover:scale-105"
                    title="Swap Pickup and Delivery Locations"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5 rotate-90" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                    <span>Delivery Location (Destination) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryLocation}
                    onChange={e => setFormData({ ...prev => prev, deliveryLocation: e.target.value })}
                    placeholder="City, State, Terminal Hub"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Vehicle Select options */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Vehicle Type *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.vehicleType}
                    onChange={e => setFormData({ ...prev => prev, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                  >
                    {VEHICLE_OPTIONS.map((v, i) => (
                      <option key={i} value={v}>
                        {v}
                      </option>
                    ))}
                    <option value="Other / Special Transport">Other Custom Fleet Truck</option>
                  </select>
                </div>
              </div>

              {/* Cargo Type & Cargo Weight row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    <span>Cargo Type</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cargoType}
                    onChange={e => setFormData({ ...prev => prev, cargoType: e.target.value })}
                    placeholder="e.g. Produce, Steel, Hazmat"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <Weight className="h-3.5 w-3.5 text-slate-400" />
                    <span>Cargo Weight</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cargoWeight}
                    onChange={e => setFormData({ ...prev => prev, cargoWeight: e.target.value })}
                    placeholder="e.g. 35,000 lbs"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Distance and Date Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Departure Date & Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={e => setFormData({ ...prev => prev, departureTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Estimated Distance (Miles / Km)
                  </label>
                  <input
                    type="text"
                    value={formData.estimatedDistance}
                    onChange={e => setFormData({ ...prev => prev, estimatedDistance: e.target.value })}
                    placeholder="e.g. 960 Miles"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Special Instructions / Logistics Constraints
                </label>
                <textarea
                  rows={3}
                  value={formData.specialInstructions}
                  onChange={e => setFormData({ ...prev => prev, specialInstructions: e.target.value })}
                  placeholder="Enter receiver instructions, temp requirements, specific lane preferences, delivery windows, or driver handoffs."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                ></textarea>
              </div>

              {/* Action Generating Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer active:scale-[0.99] shadow-slate-900/10 hover:shadow-slate-900/20"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing Route & Planning Safe Run...</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    <span>Generate AI Trip Briefing</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Database & Archived Briefings Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 grow flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-slate-500" />
                <h3 className="text-sm font-bold font-display text-slate-900 uppercase tracking-wide">
                  Saved Trip Briefings
                </h3>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 font-mono font-medium px-2 py-0.5 rounded-md">
                {filteredSavedTrips.length} Saved
              </span>
            </div>

            {/* Filter Input */}
            <div className="relative mb-3.5">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search trip ID, driver, cargo or route..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* List container */}
            <div className="grow overflow-y-auto max-h-[350px] space-y-2 pr-1">
              {filteredSavedTrips.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 border border-dashed border-slate-100 rounded-lg">
                  <Truck className="h-8 w-8 text-slate-200 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-medium">No archived briefings found</p>
                  <p className="text-[11px] text-slate-400/80 mt-1 max-w-[200px]">
                    {searchQuery ? "No matches for this query filters" : "Generate your first briefing to store logs here."}
                  </p>
                </div>
              ) : (
                filteredSavedTrips.map((item) => {
                  const isSelected = selectedSavedId === item.id;
                  let complexityBadgeColor = "";
                  switch (item.briefing.tripComplexity) {
                    case "High":
                      complexityBadgeColor = "bg-rose-50 text-rose-700 border-rose-200/50";
                      break;
                    case "Moderate":
                      complexityBadgeColor = "bg-amber-50 text-amber-700 border-amber-200/50";
                      break;
                    default:
                      complexityBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/50";
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleLoadSavedTrip(item)}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-950 shadow-md"
                          : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                          <span className={isSelected ? "text-teal-400" : "text-slate-900"}>
                            {item.input.tripId}
                          </span>
                          <span className="text-slate-400 text-[10px] font-normal font-sans">
                            {item.timestamp.split(",")[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border ${complexityBadgeColor}`}>
                            {item.briefing.tripComplexity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedTrip(item.id, e)}
                            className={`p-1 rounded-md transition-colors ${
                              isSelected
                                ? "hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                                : "hover:bg-slate-100 text-slate-400 hover:text-rose-600"
                            }`}
                            title="Delete this record"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-1.5 grid grid-cols-2 gap-x-2 text-[11px] leading-tight">
                        <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                          Driver: <strong className={isSelected ? "text-white" : "text-slate-700"}>{item.input.driverName || "Unknown"}</strong>
                        </span>
                        <span className={`text-right truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          {item.input.cargoType}
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] flex items-center gap-1.5 pt-1.5 border-t border-slate-100/10">
                        <span className="truncate max-w-[45%] font-medium">{item.input.pickupLocation.split(",")[0]}</span>
                        <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[45%] font-slate-900 font-medium">{item.input.deliveryLocation.split(",")[0]}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Professional Summary Output (Columns 6 to 12) */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Empty / Setup Guidelines Card if no briefing exists yet */}
          {!briefing && !loading && !errorMessage && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center grow min-h-[500px]">
              
              <div className="bg-slate-50 text-slate-400 p-5 rounded-full mb-4">
                <Truck className="h-12 w-12 text-slate-300 animate-pulse stroke-[1.2]" />
              </div>

              <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">
                Awaiting Operations Input
              </h3>
              
              <p className="text-slate-500 text-sm max-w-md mt-2 leading-relaxed">
                Enter your shipment details, start/endpoints, cargo type, and logistics constraints. Our AI route surveyor will generate an interactive, compliance-ready driver briefing report instantly.
              </p>

              {/* Practical tips to test */}
              <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-left max-w-lg w-full text-xs text-slate-600">
                <p className="font-semibold text-slate-800 uppercase tracking-widest text-[10px] mb-2 text-center decoration-teal-600">
                  ⚡ Operational Instructions
                </p>
                <ul className="space-y-2 list-none pl-1">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold shrink-0">1.</span>
                    <span>Use the **Scenario Presets** bar at the top to load pre-configured routes (Reefer, City, flatbeds).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold shrink-0">2.</span>
                    <span>Review/edit generated guidelines such as toll updates, fuel constraints or weight considerations.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold shrink-0">3.</span>
                    <span>Print clean sheets for vehicle logbooks, or copy formatted markdown files directly with one click.</span>
                  </li>
                </ul>
              </div>

              {/* Developer / Operations API warning reminder */}
              <p className="text-[11px] text-slate-400 mt-6 italic">
                Remember to configure your <strong className="text-slate-600 font-medium">GEMINI_API_KEY</strong> environment secret under the "Secrets" button if using a custom project backend.
              </p>
            </div>
          )}

          {/* Loading States with dynamic cargo visualization */}
          {loading && (
            <div className="bg-slate-900 text-white rounded-xl p-8 flex flex-col items-center justify-center text-center grow min-h-[500px] border border-slate-950">
              <div className="relative mb-6">
                {/* Truck moving visual loop */}
                <div className="h-14 w-28 bg-slate-800 rounded-lg flex items-center justify-around border border-slate-700/60 p-2 relative shadow-inner">
                  <div className="absolute top-0 right-3 bg-red-500 h-1.5 w-1.5 rounded-full animate-ping"></div>
                  <Package className="h-7 w-7 text-teal-400 animate-bounce" />
                  <Truck className="h-8 w-8 text-slate-300" />
                </div>
                {/* Visual road lines */}
                <div className="w-32 h-1 bg-slate-800 mx-auto mt-2 relative overflow-hidden rounded-full">
                  <div className="absolute top-0 bottom-0 left-0 bg-teal-400 w-1/3 rounded animate-[ping_1.5s_infinite]"></div>
                </div>
              </div>

              <h3 className="text-lg font-bold font-display text-white tracking-wide">
                Routing Server Processing
              </h3>
              
              <div className="text-xs text-slate-400 font-mono space-y-1.5 max-w-sm mt-3 leading-relaxed text-left bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <p className="text-teal-400">⚡ Initialized AI Intelligence API Request</p>
                <p className="text-slate-400">&gt; Target Route: {formData.pickupLocation ? formData.pickupLocation.split(",")[0] : "..."} ➜ {formData.deliveryLocation ? formData.deliveryLocation.split(",")[0] : "..."}</p>
                <p className="text-slate-400">&gt; Vehicle Config: {formData.vehicleType}</p>
                <p className="text-slate-400">&gt; Weight Class Check: {formData.cargoWeight || "N/A"}</p>
                <p className="text-teal-500 animate-pulse">&gt; Compiling weather, construction and highway surveys...</p>
              </div>
            </div>
          )}

          {/* Error Message Display block */}
          {errorMessage && (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 grow min-h-[400px] flex flex-col items-center justify-center text-center">
              <div className="bg-red-50 text-red-500 p-4 rounded-full mb-3">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-red-800 font-display">
                Briefing Generation Failed
              </h3>
              <p className="text-slate-600 text-sm max-w-md mt-1 mb-5">
                {errorMessage}
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left max-w-md text-xs text-slate-700 font-mono space-y-1.5">
                <p className="font-semibold text-slate-800">💡 Troubleshooting Steps:</p>
                <p>1. Ensure your Gemini API Key is entered correctly under Settings (Secrets).</p>
                <p>2. Verify that pickup, delivery, and vehicle type are specified correctly.</p>
                <p>3. Refresh the development server and try again in 30 seconds.</p>
              </div>
            </div>
          )}

          {/* Highly Crafted Report Terminal layout (The active Briefing Output) */}
          {briefing && !loading && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-8 animate-fade-in text-slate-900 print-card">
              
              {/* Actions Header Bar for Digital Tablet vs Paper dispatch */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200/80 no-print">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block bg-teal-100 text-teal-800 text-[11px] px-2.5 py-1 rounded font-bold font-mono uppercase">
                    Active Board
                  </span>
                  <span className="text-xs text-slate-500">
                    Live Digital Assistant Sheet
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  
                  {/* Copy Report */}
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className={`flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${
                      copiedStatus
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
                    }`}
                    title="Copy formatted summary to clipboard"
                  >
                    {copiedStatus ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copied Plain Text!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Copy Plain Text</span>
                      </>
                    )}
                  </button>

                  {/* Print Dispatch Slip */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg transition-all shadow-sm cursor-pointer"
                    title="Print Dispatch Handout"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    <span>Print Slip</span>
                  </button>

                </div>
              </div>

              {/* PRINT ONLY HEADER - Hidden online, but prints perfectly */}
              <div className="hidden print-only mb-6 border-b-2 border-slate-900 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold font-display uppercase tracking-wide">
                      VOYAGESURVEYOR DISPATCH SHEET
                    </h1>
                    <p className="text-xs text-slate-500">
                      Generated via AI Route Analysis System on 2026-05-29
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-slate-900 text-white font-mono text-xs font-bold px-3 py-1 rounded">
                      TRIP: {formData.tripId || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* CORE METADATA CARD (Perfect Visual Block) */}
              <div className="bg-slate-900 text-white rounded-xl p-5 md:p-6 mb-6 relative overflow-hidden shadow-inner font-sans">
                {/* Absolute background accent */}
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none"></div>
                
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚚</span>
                    <h3 className="font-display font-bold text-base md:text-lg tracking-wide text-white uppercase">
                      Trip Summary Report
                    </h3>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block text-right font-mono">ID Ref Record</span>
                    <span className="font-mono text-sm md:text-base font-bold text-teal-400 block tracking-wider">
                      {formData.tripId || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Grid values */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10.5px] text-slate-400 block mb-1">Assigned Driver</span>
                    <strong className="text-[13px] text-white block truncate">
                      {formData.driverName || "Not Assigned"}
                    </strong>
                  </div>

                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10.5px] text-slate-400 block mb-1">Fleet Vehicle</span>
                    <strong className="text-[13px] text-white block truncate" title={formData.vehicleType}>
                      {formData.vehicleType || "Standard Trailer"}
                    </strong>
                  </div>

                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10.5px] text-slate-400 block mb-1">Cargo & Weight</span>
                    <strong className="text-[13px] text-teal-300 block truncate" title={`${formData.cargoType} (${formData.cargoWeight})`}>
                      {formData.cargoType || "Dry Van"} | {formData.cargoWeight || "N/A"}
                    </strong>
                  </div>

                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10.5px] text-slate-400 block mb-1">Schedule & Distance</span>
                    <strong className="text-[13px] text-white block truncate">
                      {formData.estimatedDistance || "TBD"} @ {formData.departureTime ? formData.departureTime.replace("T", " ") : "Now"}
                    </strong>
                  </div>

                </div>
              </div>

              {/* REPORT SECTIONS */}
              <div className="space-y-6 text-slate-800">
                
                {/* 1. ROUTE OVERVIEW */}
                <div className="pb-4 border-b border-slate-100">
                  <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">
                    <span className="bg-amber-100 text-amber-800 rounded p-1 text-xs shrink-0">📍</span>
                    <span>Route Overview</span>
                  </h4>
                  <div className="pl-8 text-sm text-slate-700 leading-relaxed font-normal">
                    {briefing.routeOverview}
                  </div>
                </div>

                {/* 2. ROUTE SUMMARY & ROAD NOTES */}
                <div className="pb-4 border-b border-slate-100">
                  <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">
                    <span className="bg-blue-100 text-blue-800 rounded p-1 text-xs shrink-0">🛣</span>
                    <span>Route Notes</span>
                  </h4>
                  <div className="pl-8 text-sm text-slate-700 leading-relaxed font-normal bg-slate-50/50 p-3 rounded-lg border border-slate-100 font-mono text-xs max-w-full overflow-x-auto whitespace-pre-line">
                    {briefing.routeNotes}
                  </div>
                </div>

                {/* 3. EXPECTED CHALLENGES (With Interactive Driver Verification Checkboxes) */}
                <div className="pb-4 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-slate-900">
                      <span className="bg-rose-100 text-rose-800 rounded p-1 text-xs shrink-0">⚠</span>
                      <span>Expected Challenges</span>
                    </h4>
                    <span className="text-[10.5px] text-slate-400 font-medium italic pl-8 sm:pl-0 no-print">
                      Driver checklist: Confirm risks are accounted for
                    </span>
                  </div>
                  
                  <div className="pl-0 sm:pl-8 space-y-2">
                    {briefing.expectedChallenges.map((challenge, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setCheckedChallenges(prev => ({
                            ...prev,
                            [idx]: !prev[idx]
                          }));
                        }}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          checkedChallenges[idx]
                            ? "bg-slate-50 border-slate-200 opacity-60 text-slate-500"
                            : "bg-rose-50/40 border-rose-100 text-slate-800 hover:bg-rose-50/70"
                        }`}
                      >
                        <div className="pt-0.5 shrink-0 no-print">
                          {checkedChallenges[idx] ? (
                            <div className="bg-slate-600 rounded text-white p-0.5">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <div className="border border-slate-300 bg-white rounded h-4 w-4"></div>
                          )}
                        </div>
                        <span className={`text-xs md:text-sm font-normal leading-relaxed ${checkedChallenges[idx] ? "line-through text-slate-400" : ""}`}>
                          {challenge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. FUEL PLANNING NOTES */}
                <div className="pb-4 border-b border-slate-100">
                  <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">
                    <span className="bg-emerald-100 text-emerald-800 rounded p-1 text-xs shrink-0 font-bold">⛽</span>
                    <span>Fuel Planning</span>
                  </h4>
                  <div className="pl-8 text-sm text-slate-700 leading-relaxed font-normal">
                    {briefing.fuelPlanning}
                  </div>
                </div>

                {/* 5. TOLL INFORMATION */}
                <div className="pb-4 border-b border-slate-100">
                  <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">
                    <span className="bg-purple-100 text-purple-800 rounded p-1 text-xs shrink-0">💰</span>
                    <span>Toll Notes</span>
                  </h4>
                  <div className="pl-8 text-sm text-slate-700 leading-relaxed font-normal">
                    {briefing.tollNotes}
                  </div>
                </div>

                {/* 6. DELIVERY & RECEIVER INSTRUCTIONS */}
                <div className="pb-4 border-b border-slate-100">
                  <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">
                    <span className="bg-indigo-100 text-indigo-800 rounded p-1 text-xs shrink-0">📦</span>
                    <span>Delivery Instructions</span>
                  </h4>
                  <div className="pl-8 text-sm text-slate-700 leading-relaxed font-normal bg-indigo-50/30 p-3 rounded-lg border border-indigo-100">
                    {briefing.deliveryInstructions}
                  </div>
                </div>

                {/* 7. SAFETY RECOMMENDATIONS (With Interactive Checkoff checkboxes) */}
                <div className="pb-4 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-slate-900">
                      <span className="bg-cyan-100 text-cyan-800 rounded p-1 text-xs shrink-0">🦺</span>
                      <span>Safety Recommendations</span>
                    </h4>
                    <span className="text-[10.5px] text-slate-400 font-medium italic pl-8 sm:pl-0 no-print">
                      Driver checklist: Confirm safety gear/pre-trip inspection
                    </span>
                  </div>
                  
                  <div className="pl-0 sm:pl-8 space-y-2">
                    {briefing.safetyRecommendations.map((safetyItem, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setCheckedSafety(prev => ({
                            ...prev,
                            [idx]: !prev[idx]
                          }));
                        }}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          checkedSafety[idx]
                            ? "bg-slate-50 border-slate-200 opacity-60 text-slate-500"
                            : "bg-teal-50/40 border-teal-100/50 text-slate-800 hover:bg-teal-50/70"
                        }`}
                      >
                        <div className="pt-0.5 shrink-0 no-print">
                          {checkedSafety[idx] ? (
                            <div className="bg-teal-700 rounded text-white p-0.5">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <div className="border border-teal-300 bg-white rounded h-4 w-4"></div>
                          )}
                        </div>
                        <span className={`text-xs md:text-sm font-normal leading-relaxed ${checkedSafety[idx] ? "line-through text-slate-450" : ""}`}>
                          {safetyItem}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 8. OPERATIONS SUMMARY & COMPLEXITY */}
                <div className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                    
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-200 text-slate-800 p-2 rounded-lg font-mono text-base font-bold">📊</span>
                      <div>
                        <span className="text-[10.5px] text-slate-500 uppercase tracking-widest block font-semibold">Operations Readiness</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-700 font-medium font-sans">Trip Complexity:</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                            briefing.tripComplexity === "High"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : briefing.tripComplexity === "Moderate"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}>
                            {briefing.tripComplexity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                      <span className="text-[10.5px] text-slate-400 uppercase tracking-widest block">✅ Final Summary</span>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal mt-1 italic">
                        {briefing.finalSummary}
                      </p>
                    </div>

                  </div>
                </div>

              </div>

              {/* PRINT ONLY FOOTER */}
              <div className="hidden print-only mt-12 pt-6 border-t border-slate-300 text-[10px] text-slate-400 text-center">
                <p>VoyageSurveyor Smart Driver Briefing System. Authorized Dispatch Document Copy.</p>
                <p className="mt-1 font-mono">Trip: {formData.tripId || "N/A"} - Signature: _______________________ Date: 2026-05-29</p>
              </div>

            </div>
          )}

          {/* Copy-Paste RAW Markdown Textbox at the very bottom so drivers can copy for offline usage */}
          {briefing && !loading && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-1 no-print">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Clipboard className="h-4 w-4 text-slate-400" />
                  <span>Raw Output Log (Copy to dispatch tools)</span>
                </span>
                <span className="text-[11px] text-indigo-600 font-mono">Ready to Paste</span>
              </div>
              <textarea
                readOnly
                rows={8}
                value={getPromptFormattedText()}
                className="w-full bg-slate-900 text-slate-200 p-3.5 rounded-lg font-mono text-xs border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none overflow-y-auto"
                title="Copied payload content box"
              />
            </div>
          )}

        </div>

      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto no-print">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 VoyageSurveyor Inc. Designed for heavy payload logistics management.</p>
          <div className="flex items-center gap-3">
            <span className="text-emerald-500 font-bold font-mono">● All Dispatch Services Live</span>
            <span className="text-slate-300">|</span>
            <a href="https://ai.studio/build" className="text-slate-500 hover:text-slate-800 underline flex items-center gap-0.5">
              Powered by Gemini <ExternalLink className="h-3 w-3 inline" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
