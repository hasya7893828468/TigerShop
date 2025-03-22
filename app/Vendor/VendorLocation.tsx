import { useEffect, useState } from "react";
import axios from "axios";

const VendorLocation = () => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [vendorLocation, setVendorLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [orders, setOrders] = useState([]);
  const vendorId = localStorage.getItem("vendorId");

  // ✅ Fetch Vendor's Current Location
  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(newLocation);

          // ✅ Send location to backend
          axios
            .post("https://backendforworld.onrender.com/api/vendors/update-location", {
              vendorId,
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            })
            .then((response) => console.log("✅ Location updated:", response.data))
            .catch((error) => console.log("❌ Error updating location:", error));
        },
        (error) => console.log("❌ Error getting location:", error),
        { enableHighAccuracy: true }
      );
    }
  };

  // ✅ Fetch Vendor's Stored Location
  const fetchVendorLocation = async () => {
    if (!vendorId) return;

    try {
      const response = await axios.get(`https://backendforworld.onrender.com/api/vendors/vendor-location/${vendorId}`);
      if (response.data.latitude && response.data.longitude) {
        setVendorLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
        });
        console.log("📍 Vendor Location Fetched:", response.data);
      } else {
        console.log("❌ Vendor location not found.");
      }
    } catch (error) {
      console.error("❌ Error fetching vendor location:", error);
    }
  };

  useEffect(() => {
    fetchLocation();
    fetchVendorLocation();
    const interval = setInterval(fetchLocation, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (vendorId) {
      axios
        .get(`https://backendforworld.onrender.com/api/vendor-cart/${vendorId}`)
        .then((response) => {
          console.log("📥 Orders received:", response.data);
          setOrders(response.data);
        })
        .catch((error) => console.error("❌ Error fetching orders:", error));
    }
  }, [vendorId]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center">Vendor Dashboard</h2>

      <button
        onClick={fetchLocation}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        📍 Get Exact Location
      </button>

      {userLocation && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600">
            Latitude: {userLocation.latitude} | Longitude: {userLocation.longitude}
          </p>
          <a
            href={`https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-3 py-1 rounded mt-2 inline-block"
          >
            🌍 View Your Location on Google Maps
          </a>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">No orders placed</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {orders.map((order) => (
            <div key={order._id} className="shadow-md rounded-lg p-4 bg-white">
              <h3 className="font-bold text-lg text-center">Order ID: {order._id}</h3>
              <p className="text-sm text-gray-500 text-center">
                📅 Order Date: {new Date(order.createdAt).toLocaleString()}
              </p>
              <p className="text-md font-semibold text-center text-blue-600">
                👤 Ordered by: {order.userName || "Unknown User"}
              </p>

              {order.userLocation?.latitude && order.userLocation?.longitude && (
                <div className="mt-2 text-center">
                  <a
                    href={`https://www.google.com/maps?q=${order.userLocation.latitude},${order.userLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 text-white px-3 py-1 rounded mt-2 inline-block"
                  >
                    📍 View Customer Location
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorLocation;
