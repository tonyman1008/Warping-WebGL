import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ThreeViewer from './Components/three/ThreeViewer';
import ComparisonThreeViewer from './Components/three/ComparisonThreeViewer';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Switch>
        <Route path="/compare" component={ComparisonThreeViewer} />
        <Route path="/" exact component={ThreeViewer} />
      </Switch>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
