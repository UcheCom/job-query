import { useState } from "react";
import "./styles.css";

function App() {
  const [jobTitle, setJobTitle] = useState("Customer Success Manager");
  const [questions, setQuestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateQuestions = async () => {
    setLoading(true);
    setError("");
    setQuestions("");

    try {
      const response = await fetch("http://localhost:5000/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setQuestions(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Interview Question Generator</h1>

      <div className="input-group">
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Enter a job title"
        />

        <button onClick={generateQuestions} disabled={loading}>
          {loading ? "Generating..." : "Generate Questions"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

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