
import React, { useState } from 'react';
import {
  Car,
  MapPin,
  Clock,
  ShieldCheck,
  Leaf,
  Users,
  Calculator,
  Search,
  PlusCircle,
  UserPlus,
} from 'lucide-react';
import { MODULES } from '../data/seed';

export default function RidePooling() {
  const moduleData = MODULES.find((m) => m.id === 'ride-pooling');
  const sampleRoutes = moduleData?.sampleRoutes || [];

  // Emission calculator state
  const [commuteDistance, setCommuteDistance] = useState(12);
  const [coRiders, setCoRiders] = useState(3);

  // Convert existing sample routes into interactive rides
  const [rides, setRides] = useState(() =>
    sampleRoutes.map((route) => {
      const [from = route.corridor, to = ''] =
        route.corridor.split(' -> ');

      return {
        ...route,
        from,
        to,
        departureTime: route.departsIn,
        seats: route.availableSeats,
        joined: false,
      };
    })
  );

  // Offer Ride form state
  const [rideFrom, setRideFrom] = useState('');
  const [rideTo, setRideTo] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState('2');

  // Find Ride search state
  const [searchDestination, setSearchDestination] = useState('');

  const soloKg = commuteDistance * 0.17;
  const pooledKg = soloKg / (coRiders + 1);
  const savedKg = soloKg - pooledKg;

  const filteredRides = rides.filter((ride) => {
    const query = searchDestination.trim().toLowerCase();

    return (
      ride.seats > 0 &&
      (!query ||
        ride.to.toLowerCase().includes(query) ||
        ride.from.toLowerCase().includes(query) ||
        ride.corridor.toLowerCase().includes(query))
    );
  });

  function handleOfferRide(event) {
    event.preventDefault();

    if (!rideFrom.trim() || !rideTo.trim() || !departureTime) {
      return;
    }

    const newRide = {
      id: `rt-${Date.now()}`,
      from: rideFrom.trim(),
      to: rideTo.trim(),
      corridor: `${rideFrom.trim()} -> ${rideTo.trim()}`,
      departureTime,
      departsIn: departureTime,
      availableSeats: Number(availableSeats),
      seats: Number(availableSeats),
      driverType: 'Student Commuter',
      estDistanceKm: 0,
      joined: false,
    };

    setRides((previousRides) => [...previousRides, newRide]);

    setRideFrom('');
    setRideTo('');
    setDepartureTime('');
    setAvailableSeats('2');
  }

  function handleJoinRide(rideId) {
    setRides((previousRides) =>
      previousRides.map((ride) =>
        ride.id === rideId && ride.seats > 0 && !ride.joined
          ? {
              ...ride,
              seats: ride.seats - 1,
              joined: true,
            }
          : ride
      )
    );
  }

  return (
    <div className="ride-pooling-module">
      {/* Module overview */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <ShieldCheck
              size={20}
              color="var(--brand-green-700)"
            />
            <span>Smart Campus Ride-Pooling & Commuter Mobility</span>
          </div>
        </div>

        <div className="uni-card-body">
          <p
            style={{
              color: 'var(--text-secondary)',
              marginBottom: '16px',
            }}
          >
            {moduleData?.description}
          </p>

          <div className="uni-grid-3">
            <div>
              <MapPin size={22} color="var(--brand-green-700)" />
              <strong>Corridor Route Bundling</strong>
              <p>
                Find commuters travelling along similar routes to reduce
                redundant vehicle trips.
              </p>
            </div>

            <div>
              <ShieldCheck
                size={22}
                color="var(--brand-green-700)"
              />
              <strong>Verified Campus Identity</strong>
              <p>
                Designed for institutional authentication of campus
                drivers and passengers.
              </p>
            </div>

            <div>
              <Leaf size={22} color="var(--brand-green-700)" />
              <strong>Estimated Emission Offsets</strong>
              <p>
                Estimate potential carbon savings when students share
                their commute.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Offer a ride */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <PlusCircle
              size={20}
              color="var(--brand-green-700)"
            />
            <span>Offer a Ride</span>
          </div>
        </div>

        <div className="uni-card-body">
          <form onSubmit={handleOfferRide}>
            <div className="uni-grid-2">
              <div className="uni-form-group">
                <label className="uni-label" htmlFor="ride-from">
                  Starting Point
                </label>
                <input
                  id="ride-from"
                  className="uni-input"
                  type="text"
                  placeholder="e.g. Andheri Station"
                  value={rideFrom}
                  onChange={(event) => setRideFrom(event.target.value)}
                  required
                />
              </div>

              <div className="uni-form-group">
                <label className="uni-label" htmlFor="ride-to">
                  Destination
                </label>
                <input
                  id="ride-to"
                  className="uni-input"
                  type="text"
                  placeholder="e.g. SPIT Campus"
                  value={rideTo}
                  onChange={(event) => setRideTo(event.target.value)}
                  required
                />
              </div>

              <div className="uni-form-group">
                <label className="uni-label" htmlFor="ride-time">
                  Departure Time
                </label>
                <input
                  id="ride-time"
                  className="uni-input"
                  type="time"
                  value={departureTime}
                  onChange={(event) =>
                    setDepartureTime(event.target.value)
                  }
                  required
                />
              </div>

              <div className="uni-form-group">
                <label className="uni-label" htmlFor="ride-seats">
                  Available Seats
                </label>
                <select
                  id="ride-seats"
                  className="uni-input"
                  value={availableSeats}
                  onChange={(event) =>
                    setAvailableSeats(event.target.value)
                  }
                >
                  <option value="1">1 seat</option>
                  <option value="2">2 seats</option>
                  <option value="3">3 seats</option>
                  <option value="4">4 seats</option>
                  <option value="5">5 seats</option>
                </select>
              </div>
            </div>

            <button className="uni-button" type="submit">
              <Car size={17} />
              Publish Ride
            </button>
          </form>
        </div>
      </div>

      {/* Find and join a ride */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Search size={20} color="var(--brand-green-700)" />
            <span>Find a Ride</span>
          </div>

          <span className="uni-badge uni-badge-neutral">
            {filteredRides.length} Available
          </span>
        </div>

        <div className="uni-card-body">
          <div className="uni-form-group">
            <label className="uni-label" htmlFor="ride-search">
              Search by starting point or destination
            </label>
            <input
              id="ride-search"
              className="uni-input"
              type="search"
              placeholder="Try Engineering Hall or West Campus..."
              value={searchDestination}
              onChange={(event) =>
                setSearchDestination(event.target.value)
              }
            />
          </div>

          {filteredRides.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              No available rides match your search. Try another
              destination or offer a new ride.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredRides.map((ride) => (
                <div
                  key={ride.id}
                  style={{
                    padding: '16px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 220px' }}>
                    <strong>{ride.from} → {ride.to}</strong>
                    <div style={{ marginTop: '6px' }}>
                      <Users size={15} style={{ verticalAlign: 'middle' }} />
                      {' '}{ride.seats} seat(s) available
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <Clock size={15} style={{ verticalAlign: 'middle' }} />
                      {' '}{ride.departureTime}
                    </div>
                    <div
                      style={{
                        marginTop: '4px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {ride.driverType}
                      {ride.estDistanceKm > 0
                        ? ` • ${ride.estDistanceKm} km estimated`
                        : ''}
                    </div>
                  </div>

                  <button
                    className="uni-button"
                    type="button"
                    disabled={ride.seats <= 0 || ride.joined}
                    onClick={() => handleJoinRide(ride.id)}
                  >
                    <UserPlus size={16} />
                    {ride.joined ? 'Joined' : 'Join Ride'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Emission calculator */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Calculator
              size={20}
              color="var(--brand-green-700)"
            />
            <span>Commuter Emission Estimation Model</span>
          </div>
          <span className="uni-badge uni-badge-neutral">
            Mathematical Model
          </span>
        </div>

        <div className="uni-card-body">
          <div className="uni-grid-2">
            <div>
              <div className="uni-form-group">
                <label className="uni-label">
                  One-Way Commute Distance: {commuteDistance} km
                </label>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={commuteDistance}
                  onChange={(event) =>
                    setCommuteDistance(Number(event.target.value))
                  }
                  style={{ width: '100%' }}
                  aria-label="Commute distance in kilometers"
                />
              </div>

              <div className="uni-form-group">
                <label className="uni-label">
                  Number of Co-Riders Sharing Trip: {coRiders} Passengers
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={coRiders}
                  onChange={(event) =>
                    setCoRiders(Number(event.target.value))
                  }
                  style={{ width: '100%' }}
                  aria-label="Number of co-riders"
                />
              </div>

              <p>
                Model assumption: approximately 0.17 kg CO₂ per vehicle
                kilometer. This is a simplified illustrative estimate.
              </p>
            </div>

            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--bg-canvas)',
                textAlign: 'center',
              }}
            >
              <div>Estimated Net Avoided Emissions</div>
              <h2>{savedKg.toFixed(2)} kg CO₂e</h2>
              <p>
                Baseline solo trip: {soloKg.toFixed(2)} kg CO₂e vs.
                pooled trip: {pooledKg.toFixed(2)} kg CO₂e per passenger.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample route reference */}
      <div className="uni-card">
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title">
              <MapPin size={20} color="var(--brand-green-700)" />
              <span>Original Sample Route Corridors</span>
            </div>
            <div className="uni-card-desc">
              Reference data provided by the UniVerse prototype.
            </div>
          </div>
        </div>

        <div className="uni-card-body">
          {sampleRoutes.map((route) => (
            <div
              key={route.id}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <strong>{route.corridor}</strong>
              <div style={{ marginTop: '5px' }}>
                {route.driverType} • {route.estDistanceKm} km
                {' • '}{route.availableSeats} sample seats
                {' • '}{route.departsIn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
