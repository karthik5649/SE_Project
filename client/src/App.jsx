import { useEffect, useMemo, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useForm } from 'react-hook-form';

function App() {

  const { register, handleSubmit, reset } = useForm();
  const [socketId,setSocketId] = useState("")
  const [messages, setMessages] = useState(['hello']);
  const [msg,setMsg] = useState("")
  const [user, setUser] = useState("")
  
  const socket = useMemo(() => io('http://localhost:3000'), []); 

  function addMessage(data) {
    socket.emit('message', data);
    reset();
  }

  function setUserId(data){
    setUser(data.id1)
    reset()
  }

  console.log(user)

  useEffect(() => {

    socket.on('connect', () => {
      setSocketId(socket.id)
      console.log("Connection established:", socket.id);
    });

    socket.on('receive-msg', (data) => {
      if(data.id2 == user){
        console.log("Received message:", data.msg);
        setMsg(data.msg)
      }
    });

  },[])

  useEffect(()=>{
    msg.length != 0 && setMessages((prevMsgs)=>[...prevMsgs,msg]);
    setMsg('')
  },[msg])

  return (
    <div>
      <form onSubmit={handleSubmit(setUserId)} className='form-control m-5 p-3'>
        <label htmlFor="id1">Your Name : </label>
        <input type='text' className='form-control mb-3' {...register("id1")} id='id1' />
        <button className="btn btn-danger">Set</button>
      </form>
      <form onSubmit={handleSubmit(addMessage)} className='form-control m-5 p-3'>
        <label htmlFor="id2">Receiver Name : </label>
        <input type='text' className='form-control mb-3' {...register("id2")} id='id2' />
        <label htmlFor="id2">Message : </label>
        <input type="text" className="form-control mb-3" {...register("msg")} id='msg' />
        <button className='btn btn-primary' type="submit">Send</button>
      </form>

      {/* Display received messages */}
      <div className="m-5">
        <h3>Messages:</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
