import { useState, useEffect } from "react";
import axios from "axios";
import { DollarSign, Users, Calendar } from "lucide-react";
import { useSocket } from "../context/SocketContext";

export default function Home({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

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

  useEffect(() => {
    if (socket) {
      socket.on('task_open', fetchTasks);
      socket.on('task_created', fetchTasks);
      return () => {
        socket.off('task_open');
        socket.off('task_created');
      };
    }
  }, [socket]);

  const handleApply = async (taskId) => {
    if (!user) {
      alert("Please login to apply");
      return;
    }
    try {
      await axios.post(`http://localhost:5000/api/tasks/${taskId}/apply`);
      alert("Successfully joined the pool! Redirecting to Manage Task...");
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err.response?.data?.error || "Error applying for task");
    }
  };

  const renderDescription = (text) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--primary)", textDecoration: "underline" }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) return <div className="container" style={{ textAlign: "center", marginTop: "100px" }}>Loading tasks...</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Available Tasks</h1>
          <p className="page-subtitle">
            Complete tasks from our active prize pools.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {tasks.map((task) => {
          const spotsLeft = task.max_participants - task.participant_count;
          const rewardPerPerson = Math.floor(task.total_prize_pool / task.max_participants);
          
          return (
            <div key={task.id} className="task-list-item">
              <div className="task-info">
                <div className="task-icon">
                  <DollarSign size={24} color="var(--active-bg)" />
                </div>
                <div className="task-details">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0 }}>{task.title}</h4>
                    <span className="badge open" style={{ fontSize: '0.7rem' }}>POOL: {task.total_prize_pool}</span>
                  </div>
                  
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-muted)",
                      marginBottom: "12px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {renderDescription(task.description)}
                  </div>
                  
                  <div className="task-meta">
                    <span style={{ color: "var(--text-muted)" }}>
                      By @{task.creator_username}
                    </span>
                    <span style={{ color: "var(--active-bg)", fontWeight: 'bold' }}>
                      Prize: {rewardPerPerson} / Person
                    </span>
                    <span style={{ color: spotsLeft > 0 ? "#10b981" : "var(--danger-text)", display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} /> {spotsLeft} / {task.max_participants} Spots Left
                    </span>
                    {task.deadline && (
                      <span style={{ color: "var(--text-muted)" }}>
                        <Calendar size={14} /> {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {user && user.id !== task.creator_id && spotsLeft > 0 && (
                  <button
                    onClick={() => handleApply(task.id)}
                    className="btn-primary"
                    style={{ padding: "8px 24px" }}
                  >
                    Join Pool
                  </button>
                )}
                {spotsLeft <= 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Full</span>}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="empty-card">
            <p style={{ color: "var(--text-muted)" }}>
              No active prize pools available right now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
