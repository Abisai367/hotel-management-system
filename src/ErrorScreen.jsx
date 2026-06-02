import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorScreen.css';

const errorConfig = {
  404: {
    title: 'Page Not Found',
    subtitle: 'The page you are looking for does not exist.',
    button: 'Go to Home',
  },
  503: {
    title: 'Service Unavailable',
    subtitle: 'The service is temporarily unavailable. Please try again later.',
    button: 'Try Again',
  },
  0: {
    title: 'Offline',
    subtitle: 'No internet connection detected. Check your network and try again.',
    button: 'Retry',
  },
};

export default function ErrorScreen({ code = 404 }) {
  const config = errorConfig[code] || errorConfig[404];

  return (
    <div className="error-screen">
      <div className="error-screen__card">
        <span className="error-screen__code">{code}</span>
        <h1 className="error-screen__title">{config.title}</h1>
        <p className="error-screen__subtitle">{config.subtitle}</p>
        <Link className="error-screen__button" to="/categories">
          {config.button}
        </Link>
      </div>
    </div>
  );
}
