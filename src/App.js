import './styles/theme.css';
import './styles/game.css';
import './App.css';
import React from "react";
import Main from "./components/main";
import Ticket from "./components/ticket";
import PlayCard from './components/PlayCard';
import AdminGate from './components/AdminGate';
import { Route, Switch } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Switch>
        {/* Players reach their ticket without a password. */}
        <Route path='/card/:ticketId' component={PlayCard} />
        <Route path='/card' component={PlayCard} />
        <Route path='/admin_section'>
          <AdminGate><Ticket /></AdminGate>
        </Route>
        <Route path='/'>
          <AdminGate><Main /></AdminGate>
        </Route>
      </Switch>
    </div>
  );
}

export default React.memo(App);
