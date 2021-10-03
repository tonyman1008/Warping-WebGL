import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ThreeViewer from './Components/three/ThreeViewer';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Switch>
        <Route path="/:viewer" exact component={ThreeViewer} />
      </Switch>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
