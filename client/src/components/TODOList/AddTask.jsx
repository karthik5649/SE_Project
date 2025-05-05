import { useState } from "react";

const AddTask = ({ onAdd }) => {
  const [taskText, setTaskText] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleAddTask = () => {
    if (!taskText || !deadline) {
      alert("Please enter both task and deadline!");
      return;
    }

    onAdd(taskText, new Date(deadline).getTime());
    setTaskText("");
    setDeadline("");
  };

  return (
    <div className="add-task-form">
      <input
        type="text"
        placeholder="Add a new task..."
        value={taskText}
        onChange={(e) => setTaskText(e.target.value)}
      />
      <input
        type="datetime-local"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />
      <button onClick={handleAddTask}>Add</button>
    </div>
  );
};

export default AddTask;
