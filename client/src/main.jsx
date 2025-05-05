import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap/dist/js/bootstrap.bundle.min";
import 'bootstrap-icons/font/bootstrap-icons.css';
import {createBrowserRouter, Navigate, RouterProvider} from "react-router-dom"
import RouteLayout from './components/RouteLayout.jsx';
import Home from './components/Home.jsx';
import Signin from './components/Signin.jsx';
import Sigup from './components/Signup.jsx';
import { ClerkProvider } from '@clerk/clerk-react'
import CurrentUserContext from './context/currentUserContext.jsx';
import UserProfile from './components/UserProfile.jsx';
import Messages from './components/Messages.jsx';
import Community from './components/Community.jsx';
import CommunityDetail from './components/CommunityDetail.jsx';
import SearchUsersCommunities from './components/SearchUsersCommunities/SearchUsersCommunities.jsx';
import ChattingPage from './components/ChattingPage.jsx';
import TodoList from './components/TODOList/TodoList.jsx';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const browserRouterObj = createBrowserRouter([{
  path : "/",
  element : <RouteLayout/>,
  children : [
    {
      path : "",
      element : <Home/>,
    },{
      path : "signin",
      element:<Signin/>
    },{
      path : "signup",
      element:<Sigup/>
    },{
      path:"userprofile/:userName",
      element : <UserProfile/>
    },{
      path : "communities",
      element : <Community/>
    },{
      path : "community/:id",
      element : <CommunityDetail/>
    },{
      path : "search_users_communities",
      element:<SearchUsersCommunities/>
    },{
      path : "todolist",
      element : <TodoList/>
    }
  ]
},{
  path : "messages/",
  element : <Messages/>,
}])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <CurrentUserContext>
        <RouterProvider router={browserRouterObj}/>
      </CurrentUserContext>
    </ClerkProvider>
  </StrictMode>
)
