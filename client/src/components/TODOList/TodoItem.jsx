import { useEffect, useState } from "react";
import "./TodoList.css";

const TodoItem = ({ task, onDelete, onMarkPending, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(task.deadline - Date.now());
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(task.deadline - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [task.deadline]);

  useEffect(() => {
    if (timeLeft <= 0 && !task.isPending) {
      onMarkPending(task.id);
    }
  }, [timeLeft, onMarkPending, task]);

  const handleDelete = () => {
    setFadeOut(true);
    setTimeout(() => onDelete(task.id), 500);
  };

  const handleComplete = () => {
    setFadeOut(true);
    setTimeout(() => {
      onComplete(task.id);
      alert("Task was successfully completed!");
    }, 500);
  };

  const formatTime = (ms) => {
    if (ms <= 0) return <span className="pending-box">Pending</span>;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  };

  return (
    <li className={`task-item ${fadeOut ? "fade-out" : "fade-in"}`}>
      <span className={task.isPending ? "expired-task" : ""}>{task.text}</span>
      <div className="task-actions">
        <span className="countdown-timer">{formatTime(timeLeft)}</span>
        <button className="complete-btn" onClick={handleComplete}>✔</button>
        <button className="delete-btn" onClick={handleDelete}>❌</button>
      </div>
    </li>
  );
};

export default TodoItem;
