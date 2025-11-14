import React, { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const syncWithBackend = async (uid, token, name, email) => {
    try {
      await fetch(`${API_BASE}/api/sync-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, name, email }),
      });
    } catch (err) {
      console.error("Backend sync failed", err);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);

      // send minimal profile to backend
      await syncWithBackend(userCredential.user.uid, token, username || userCredential.user.displayName || "User", userCredential.user.email);

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Signup failed. Try again!");
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);

      await syncWithBackend(result.user.uid, token, result.user.displayName || "Google User", result.user.email);

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Google signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Create Account 🚀</h2>
        <p className="text-center text-gray-500 mb-8">Sign up to start coding battles</p>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Username</label>
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition transform hover:scale-[1.02]"
          >
            Sign Up
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-100 transition"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          <span className="text-gray-700 font-medium">Sign up with Google</span>
        </button>

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
