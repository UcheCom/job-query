import { useState } from "react";
import heroArt from "./assets/hero.png";
import "./styles.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/$/,
  "",
);

function App() {
  const [jobTitle, setJobTitle] = useState("Customer Success Manager");
  const [questions, setQuestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateQuestions = async (event) => {
    event.preventDefault();

    const trimmedJobTitle = jobTitle.trim();

    if (!trimmedJobTitle) {
      setQuestions("");
      setError("Enter a job title to generate questions.");
      return;
    }

    setLoading(true);
    setError("");
    setQuestions("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle: trimmedJobTitle,
        }),
      });

      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        throw new Error(data.error || responseText || "Something went wrong.");
      }

      if (!data.questions) {
        throw new Error("The server did not return any questions.");
      }

      setJobTitle(trimmedJobTitle);
      setQuestions(data.questions);
    } catch (err) {
      const message =
        err instanceof SyntaxError
          ? "The server returned an unreadable response."
          : err.message;

      setError(message || "Could not generate questions. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="hero">
        <div>
          <p className="eyebrow">Job Query</p>
          <h1>AI Interview Question Generator</h1>
          <p className="lede">Practice with focused questions tailored to the role in front of you.</p>
        </div>
        <img className="hero-art" src={heroArt} alt="" aria-hidden="true" />
      </header>

      <form className="input-group" onSubmit={generateQuestions}>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Enter a job title"
          aria-label="Job title"
        />

        <button type="submit" disabled={loading || !jobTitle.trim()}>
          {loading ? "Generating..." : "Generate Questions"}
        </button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      {questions && (
        <div className="results">
          <h2>Interview Questions</h2>
          <pre>{questions}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
