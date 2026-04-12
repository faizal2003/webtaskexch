import { useState, useEffect } from "react";
import axios from "axios";
import { Coins } from "lucide-react";

export default function Home({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await axios.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleApply = async (taskId) => {
    if (!user) {
      alert("Please login to apply");
      return;
    }
    try {
      await axios.post(`/tasks/${taskId}/apply`);
      alert("Applied successfully!");
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || "Error applying for task");
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Available Tasks</h1>
          <p className="page-subtitle">
            Find tasks to complete and earn points.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {tasks.map((task) => (
          <div key={task.id} className="task-list-item">
            <div className="task-info">
              <div className="task-icon">
                <Coins size={24} color="var(--active-bg)" />
              </div>
              <div className="task-details">
                <h4>{task.title}</h4>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                  }}
                >
                  {task.description}
                </div>
                <div className="task-meta">
                  <span style={{ color: "var(--text-muted)" }}>
                    Task by {task.creator_username}
                  </span>
                  <span style={{ color: "var(--active-bg)" }}>
                    {task.reward_points} Pts
                  </span>
                  {task.deadline && (
                    <span style={{ color: "var(--text-muted)" }}>
                      Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                  <span className={`badge ${task.status}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {user &&
                user.id !== task.creator_id &&
                task.status === "open" && (
                  <button
                    onClick={() => handleApply(task.id)}
                    className="btn-primary"
                    style={{ padding: "8px 24px" }}
                  >
                    Apply
                  </button>
                )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>
            No tasks available right now.
          </p>
        )}
      </div>
    </div>
  );
}
