"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface GoogleMapSelectorProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelected: (lat: number, lng: number, address: string) => void;
  apiKey: string;
}

export default function GoogleMapSelector({
  initialLatitude = 37.7749,
  initialLongitude = -122.4194,
  onLocationSelected,
  apiKey,
}: GoogleMapSelectorProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  }>({
    lat: initialLatitude,
    lng: initialLongitude,
    address: "",
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) return;

    const googleMapScript = document.createElement("script");
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    googleMapScript.async = true;
    googleMapScript.defer = true;

    googleMapScript.onload = () => {
      setMapLoaded(true);
    };

    document.head.appendChild(googleMapScript);

    return () => {
      document.head.removeChild(googleMapScript);
    };
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const initialPosition = new google.maps.LatLng(
      initialLatitude,
      initialLongitude
    );

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: initialPosition,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    const markerInstance = new google.maps.Marker({
      position: initialPosition,
      map: mapInstance,
      draggable: true,
    });

    geocoder.current = new google.maps.Geocoder();

    // Reverse geocode initial position
    reverseGeocode(initialLatitude, initialLongitude);

    // Add marker drag event
    markerInstance.addListener("dragend", () => {
      const position = markerInstance.getPosition();
      if (position) {
        const lat = position.lat();
        const lng = position.lng();
        reverseGeocode(lat, lng);
      }
    });

    // Add map click event
    mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        markerInstance.setPosition(event.latLng);
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        reverseGeocode(lat, lng);
      }
    });

    // Initialize search box
    const searchInput = document.getElementById(
      "map-search-input"
    ) as HTMLInputElement;
    if (searchInput) {
      const searchBox = new google.maps.places.SearchBox(searchInput);

      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places && places.length > 0) {
          const place = places[0];
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            mapInstance.setCenter(place.geometry.location);
            markerInstance.setPosition(place.geometry.location);

            const address = place.formatted_address || "";
            setSelectedLocation({ lat, lng, address });
            onLocationSelected(lat, lng, address);
          }
        }
      });
    }
  }, [mapLoaded, initialLatitude, initialLongitude, onLocationSelected]);

  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!geocoder.current) return;

      const latlng = { lat, lng };

      geocoder.current.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const address = results[0].formatted_address;
          setSelectedLocation({ lat, lng, address });
          onLocationSelected(lat, lng, address);
        } else {
          setSelectedLocation({ lat, lng, address: "Unknown location" });
          onLocationSelected(lat, lng, "Unknown location");
        }
      });
    },
    [onLocationSelected]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="map-search-input">Search for a location</Label>
            <Input
              id="map-search-input"
              placeholder="Enter an address, city, or place"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>

          <div
            ref={mapRef}
            className="w-full h-96 rounded-md overflow-hidden shadow-sm border"
          ></div>

          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" value={selectedLocation.lat} readOnly />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" value={selectedLocation.lng} readOnly />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={selectedLocation.address} readOnly />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
