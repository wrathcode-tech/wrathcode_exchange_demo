import { useEffect } from 'react';
import './App.css';
import Routing from './Routing'
import Loading from './customComponents/Loading';
import LoaderHelper from './customComponents/Loading/LoaderHelper';
import { ProfileProvider } from './context/ProfileProvider';
import { PlatformStatusProvider } from './context/PlatformStatusProvider';
import { Toaster } from 'react-hot-toast';
import SocketContextProvider from './customComponents/SocketContext';
import ContactEnquiry from './customComponents/ContactEnquiry';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { prefetchSpotExchangeInfo } from './customComponents/Libraries/TVChartContainer/helpers';

function App() {
  useEffect(() => {
    prefetchSpotExchangeInfo();
  }, []);

  return (
    <GoogleOAuthProvider clientId="786635375494-a0emmaqlr4i7ho9l837r9aj34qt9jamq.apps.googleusercontent.com">
      <PlatformStatusProvider>
        <ProfileProvider>
          <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 2500,
            style: {
              background: '#2b313c',
              color: '#e0e0e0',
              fontSize: '14px',
            },
          }}
          containerStyle={{
            top: 20,
            right: 20,
            zIndex: 99999999,
          }}
          />

          <SocketContextProvider>
            <Routing />
            <ContactEnquiry />
            <Loading ref={ref => LoaderHelper.setLoader(ref)} />
          </SocketContextProvider>
        </ProfileProvider>
      </PlatformStatusProvider>
    </GoogleOAuthProvider>


  )
};

export default App;