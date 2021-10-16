import 'react-app-polyfill/ie9';
import 'react-app-polyfill/stable';
import React from 'react'
import ReactDOM from 'react-dom'
import {Start} from './start'

ReactDOM.render(
  <Start render={(state)=>{document.getElementById('logon').style.display=state;}} />,
  document.getElementById('logon')
);
