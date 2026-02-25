import React, { useState, useEffect, useRef } from 'react';
import { Flame, MapPin, TrendingUp, List, Map as MapIcon, Users, ChevronRight, Search, X, Plus, Clock, Navigation } from 'lucide-react';
import { HOT_SPOTS } from '../data';
import { HotSpotArea } from '../types';

declare global {
    interface Window {
        google: any;
    }
}

// Map Styles for Dark/Cyberpunk Theme
const DARK_MAP_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "poi.business.food_and_drink", elementType: "labels", stylers: [{ visibility: "on" }] },
    { featureType: "poi.business.food_and_drink", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

export const Hotspots: React.FC = () => {
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [selectedArea, setSelectedArea] = useState<HotSpotArea | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    useEffect(() => {
        if (viewMode === 'map' && mapRef.current && window.google) {
            initMap();
        }
    }, [viewMode]);

    const initMap = () => {
        if (!mapRef.current) return;

        const defaultCenter = { lat: 28.4595, lng: 77.0266 };

        const map = new window.google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 12,
            styles: DARK_MAP_STYLE,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });

        googleMapRef.current = map;

        // Add Markers with "Pulse" simulation (using scale/opacity loop effectively)
        HOT_SPOTS.forEach((spot) => {
            if (spot.coordinates) {
                // Determine color based on trend or count
                let pulseColor = "#3b82f6"; // Default Blue (Low/Stable)
                if (spot.trend === 'up') pulseColor = "#ef4444"; // Red (High/Rising)
                else if (spot.places.length > 3) pulseColor = "#f97316"; // Orange (Medium)

                // Marker
                const marker = new window.google.maps.Marker({
                    position: spot.coordinates,
                    map: map,
                    title: spot.area,
                    icon: {
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                        fillColor: pulseColor,
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: "#ffffff",
                        scale: 1.5,
                        anchor: new window.google.maps.Point(12, 22),
                    },
                    animation: window.google.maps.Animation.DROP,
                });

                // Simulate Heatmap Pulse
                let growing = true;
                let scale = 1.5;
                setInterval(() => {
                    if (growing) {
                        scale += 0.05;
                        if (scale >= 1.8) growing = false;
                    } else {
                        scale -= 0.05;
                        if (scale <= 1.5) growing = true;
                    }
                    if (marker.getIcon()) { // Check if marker still valid
                        const icon = marker.getIcon();
                        icon.scale = scale;
                        marker.setIcon(icon);
                    }
                }, 100);

                marker.addListener("click", () => {
                    setSelectedArea(spot);
                    map.panTo(spot.coordinates!);
                    map.setZoom(14);
                });

                markersRef.current.push(marker);
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4 pb-24 pt-4 px-4 animate-fade-in h-screen flex flex-col box-border transform-none">
            {/* Added transform-none to fix potential fixed positioning context issues */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Flame className="w-8 h-8 text-orange-500" /> Vibe Radar
                    </h2>
                    <p className="text-slate-400 text-xs">Live Heatmap & Trends</p>
                </div>
                <div className="flex bg-slate-900 border border-brand-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('map')}
                        className={`p-2 rounded-md transition ${viewMode === 'map' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <MapPin className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {viewMode === 'map' ? (
                <div className="flex-1 bg-slate-950 border border-brand-900 rounded-3xl relative overflow-hidden shadow-2xl shadow-brand-900/20 group h-full">
                    {/* Google Map Container */}
                    <div ref={mapRef} className="w-full h-full" />

                    {/* Floating Search in Map */}
                    <div className="absolute top-4 left-4 right-4 z-10">
                        <div className="bg-slate-900/90 backdrop-blur border border-white/10 rounded-xl flex items-center p-3 shadow-lg">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search areas or vibes..."
                                className="bg-transparent border-none text-white text-sm ml-2 w-full focus:ring-0 placeholder-slate-500"
                            />
                        </div>
                    </div>

                    {/* flash event overlay elements could go here */}

                    {/* Detail Card Overlay */}
                    {selectedArea && (
                        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-brand-500/30 p-4 rounded-2xl animate-fade-in-up z-20 max-h-[45%] overflow-y-auto shadow-2xl">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-orange-500" /> {selectedArea.area}
                                    </h3>
                                    <p className="text-xs text-orange-400 font-medium">High Traffic • Trending Up</p>
                                </div>
                                <button
                                    onClick={() => setSelectedArea(null)}
                                    className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {selectedArea.places.map((place, i) => (
                                    <div key={i} className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5 hover:border-brand-500/30 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-200">{place.name}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{place.category}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-brand-400 flex items-center gap-1 justify-end">
                                                {place.count} <Users className="w-3 h-3" />
                                            </div>
                                            {place.trend === 'up' && <span className="text-[10px] text-green-400 flex items-center justify-end gap-0.5"><TrendingUp className="w-2 h-2" /> Rising</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gradient-to-br from-brand-900 to-slate-900 border border-brand-700/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex-1 overflow-y-auto">
                    {/* LIST VIEW (Original Content) */}
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <Flame className="w-64 h-64 text-brand-500" />
                    </div>

                    <div className="space-y-8 relative z-10">
                        {HOT_SPOTS.map((area, idx) => (
                            <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                    <h4 className="text-sm font-bold text-brand-300 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> {area.area}
                                    </h4>
                                    <span className="text-xs text-slate-500">{area.places.length} places active</span>
                                </div>

                                <div className="grid gap-3">
                                    {area.places.map((place, pIdx) => (
                                        <div key={pIdx} className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800 hover:border-brand-500/50 transition group cursor-pointer hover:bg-brand-900/20">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-600 group-hover:text-white transition">
                                                    {pIdx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-base text-slate-200 group-hover:text-brand-400 transition">{place.name}</div>
                                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">{place.category}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-lg font-bold text-white">{place.count}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase">Going</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {place.trend === 'up' && <span className="text-xs text-green-400 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> Rising</span>}
                                                    {place.trend === 'down' && <span className="text-xs text-red-400 flex items-center gap-0.5"><TrendingUp className="w-3 h-3 rotate-180" /> Quiet</span>}
                                                    {place.trend === 'stable' && <span className="text-xs text-slate-500 flex items-center gap-0.5">Stable</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Drop Vibe Floating Action Button */}
            {/* Drop Vibe functionality is now handled globally via the Navigation Bar */}
        </div>
    );
};
