import React, { useEffect, useRef, useState } from 'react';

import {
  ApolloClient,
  ApolloProvider,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { render } from 'react-dom';
import {
  Home,
  Host,
  NotFound,
  User,
  Listings,
  Login,
  AppHeader,
  Listing,
} from './sections';
import './styles/index.css';
import Layout from 'antd/lib/layout/layout';
import { Viewer } from 'lib/types';
import { Affix, Spin } from 'antd';
import { useMutation } from '@apollo/react-hooks';
import { LOG_IN } from 'lib/graphql/mutations/Login';
import {
  LogIn as LogInData,
  LogInVariables,
} from 'lib/graphql/mutations/Login/__generated__/LogIn';
import { AppHeaderSkeleton, ErrorBanner } from 'lib/components';
const httpLink = createHttpLink({
  uri: 'http://localhost:4500/api/',
});

const authLink = setContext((_, { headers }) => {
  const token = sessionStorage.getItem('token') || null;

  return {
    headers: {
      ...headers,
      'X-CSRF-TOKEN': token || '',
      // authorization: token ? `Bearer ${token}` : "",
    },
  };
});
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const initialViewer: Viewer = {
  id: null,
  token: null,
  avatar: null,
  hasWallet: null,
  didRequest: false,
};

const App = () => {
  const [viewer, setViewer] = useState<Viewer>(initialViewer);
  const [logIn, { error }] = useMutation<LogInData, LogInVariables>(LOG_IN, {
    onCompleted: (data) => {
      if (data && data.logIn) {
        setViewer(data.logIn);
        if (data.logIn.token) {
          sessionStorage.setItem('token', data.logIn.token);
        } else {
          sessionStorage.removeItem('token');
        }
      }
    },
    onError: (error) => {
      console.log(error);
    },
  });
  const logInRef = useRef(logIn);

  useEffect(() => {
    logInRef.current();
  }, []);

  if (!viewer.didRequest && !error) {
    return (
      <Layout className="app-skeleton">
        <AppHeaderSkeleton />
        <div className="app-skeleton__spin-section">
          <Spin size="large" tip="Launching Tinyhouse" />
        </div>
      </Layout>
    );
  }
  const logInErrorBannerElement = error ? (
    <ErrorBanner description="We weren't able to verify if you were logged in. Please try again later!" />
  ) : null;
  return (
    <Router>
      <Affix offsetTop={0} className="app__affix-header">
        <AppHeader viewer={viewer} setViewer={setViewer} />
      </Affix>
      <Layout id="app">
        {logInErrorBannerElement}
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/host" component={Host} />
          <Route exact path="/listing/:id" component={Listing} />
          <Route exact path="/listings/:location?" component={Listings} />
          <Route
            exact
            path="/login"
            render={(props) => <Login {...props} setViewer={setViewer} />}
          />
          <Route
            exact
            path="/user/:id"
            render={(props) => <User {...props} viewer={viewer} />}
          />
          <Route exact component={NotFound} />
        </Switch>
      </Layout>
    </Router>
  );
};

render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root')
);
