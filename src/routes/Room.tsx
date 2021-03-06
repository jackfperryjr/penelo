import {
  Actions,
  Connected,
  Connecting,
  Disconnected,
  Failed,
  Provider,
  RemoteAudioPlayer,
  Room
} from '@andyet/simplewebrtc';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import ChatContainer from '../components/ChatContainer';
import { Button } from '../styles/button';
import ChatToggle from '../components/ChatToggle';
import Haircheck from '../components/Haircheck';
import PasswordEntry from '../components/PasswordEntry';
import PeerGrid from '../components/PeerGrid';
import Sidebar from '../components/Sidebar';
import SoundPlayer from '../components/SoundPlayer';
import HiddenPeers from '../contexts/HiddenPeers';
import mq from '../styles/media-queries';
import { colorToString } from '../utils/colorify';
import SidebarIcon from 'material-icons-svg/components/baseline/Tv';

const PasswordEntryContainer = styled.div({
  alignItems: 'center',
  display: 'flex',
  flex: '1 1 0%',
  justifyContent: 'center',
  position: 'relative'
});

const RootContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(var(--vh, 1vh) * 100)'
});

const Container = styled.div({
  flex: 1,
  display: 'flex',
  position: 'relative',
  flexDirection: 'column',
  backgroundColor: '#000000',
  height: '100%',
  [mq.SMALL_DESKTOP]: {
    flexDirection: 'row'
  }
});

const LoadingState = styled.div({
  alignItems: 'center',
  display: 'flex',
  flex: '1 1 0%',
  justifyContent: 'center',
  position: 'relative'
});

const SidebarToggleButton = styled(Button)`
  position: fixed;
  border-radius: 50%;
  min-width: 50px;
  min-height: 50px;
  font-size: 20px;
  background-color: ${({ theme }) => colorToString(theme.buttonPrimaryBackground)};
  :hover {
    background-color: ${({ theme }) => colorToString(theme.secondaryBackground)};
  }
  ${mq.MOBILE} {
    bottom: 90px;
    right: -22px;
  }
  ${mq.SMALL_DESKTOP} {
    top: 10%;
    left: -22px;
  }
  z-index: 300;
`;

interface Props {
  configUrl: string;
  userData?: string;
  name: string;
  initialPassword?: string;
  mute?: () => void;
  unmute?: () => void;
}

interface State {
  activeSpeakerView: boolean;
  consentToJoin: boolean;
  pttMode: boolean;
  sendRtt: boolean;
  password?: string;
  chatOpen: boolean;
  sidebarOpen: boolean;
  hiddenPeers: string[];
}

class Index extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeSpeakerView: false,
      consentToJoin: false,
      password: props.initialPassword,
      pttMode: false,
      sendRtt: false,
      chatOpen: false,
      sidebarOpen: true,
      hiddenPeers: []
    };
  }

  public render() {
    return (
      <Provider configUrl={this.props.configUrl} userData={this.props.userData}>
        <RemoteAudioPlayer />
        <HiddenPeers.Provider
          value={{
            hiddenPeers: this.state.hiddenPeers,
            togglePeer: this.togglePeer
          }}
        >
          <RootContainer>
            {!this.state.consentToJoin && (
              <Haircheck
                onAccept={() => {
                  this.setState({ consentToJoin: true });
                  const params = new URLSearchParams(window.location.search);
                  let roomName = params.get('room');
                  localStorage.setItem('roomName', roomName ? roomName : '');
                }}
              />
            )}
            {this.state.consentToJoin && (
              <Room password={this.state.password} name={this.props.name}>
                {({ room }) => {
                  return (
                    <Container>
                      <SoundPlayer roomAddress={room.address!} />
                      {this.state.sidebarOpen ? (
                        <>
                        <Sidebar
                          roomAddress={room.address!}
                          activeSpeakerView={this.state.activeSpeakerView}
                          toggleActiveSpeakerView={this.toggleActiveSpeakerView}
                          pttMode={this.state.pttMode}
                          togglePttMode={this.togglePttMode}
                          setPassword={this.setPassword}
                          passwordRequired={room.passwordRequired}
                          roomId={room.id!}
                          currentPassword={room.password}
                          sidebarOpen={this.state.sidebarOpen}
                          toggleSidebar={this.toggleSidebar}
                        />
                        </>
                      ) : (
                        <SidebarToggleButton onClick={this.toggleSidebar}>
                          <SidebarIcon fill="#505658" width="2em" height="2em" />
                        </SidebarToggleButton>
                      )}
                      <Connecting>
                        <LoadingState>
                          <h1>Connecting...</h1>
                        </LoadingState>
                      </Connecting>
                      <Disconnected>
                        <LoadingState>
                          <h1>Lost connection. Reattempting to join...</h1>
                        </LoadingState>
                      </Disconnected>
                      <Failed>
                        <LoadingState>
                          <h1>Connection failed.</h1>
                        </LoadingState>
                      </Failed>
                      <Connected>
                        {room.joined ? (
                          <PeerGrid
                            roomAddress={room.address!}
                            activeSpeakerView={this.state.activeSpeakerView}
                            setPassword={this.setPassword}
                          />
                        ) : room.passwordRequired ? (
                          <PasswordEntryContainer>
                            <PasswordEntry
                              setting={false}
                              passwordIsIncorrect={!!this.state.password}
                              setPassword={this.setPassword}
                            />
                          </PasswordEntryContainer>
                        ) : room.roomFull ? (
                          <LoadingState>
                            <h1>This room is full.</h1>
                          </LoadingState>
                        ) : room.roomNotStarted ? (
                          <LoadingState>
                            <h1>This room has not started yet.</h1>
                          </LoadingState>
                        ) : room.banned ? (
                          <LoadingState>
                            <h1>This room is not available.</h1>
                          </LoadingState>
                        ) : (
                          <LoadingState>
                            <h1>Joining room...</h1>
                          </LoadingState>
                        )}
                      </Connected>
                      {/* {this.state.chatOpen ? (
                        <ChatContainer
                          disabled={!room.joined}
                          roomAddress={room.address!}
                          toggleChat={this.toggleChat}
                        />
                      ) : (
                        <ChatToggle roomAddress={room.address!} onClick={this.toggleChat} />
                      )} */}
                    </Container>
                  );
                }}
              </Room>
            )}
          </RootContainer>
        </HiddenPeers.Provider>
      </Provider>
    );
  }

  private toggleActiveSpeakerView = () => {
    this.setState({ activeSpeakerView: !this.state.activeSpeakerView });
  };

  private togglePttMode = (e: React.SyntheticEvent) => {
    this.setState({ pttMode: !this.state.pttMode }, () => {
      if (this.state.pttMode) {
        document.addEventListener('keydown', this.unmute);
        document.addEventListener('keyup', this.mute);
        window.addEventListener('blur', this.props.mute!);
        this.props.mute!();
      } else {
        document.removeEventListener('keydown', this.unmute);
        document.removeEventListener('keyup', this.mute);
        window.removeEventListener('blur', this.props.mute!);
        this.props.unmute!();
      }
    });

    if (e.target) {
      (e.target as HTMLElement).blur();
    }
  };

  private mute = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      this.props.mute!();
    }
  };

  private unmute = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      this.props.unmute!();
    }
  };

  private setPassword = (password: string) => {
    if (password) {
      // eslint-disable-next-line no-restricted-globals
      history.pushState(null, '', `${window.location.pathname}?room=${localStorage.getItem('roomName')}&password=${password}`);
    } else {
      // eslint-disable-next-line no-restricted-globals
      history.pushState(null, '', `${window.location.pathname}?room=${localStorage.getItem('roomName')}`);
    }
    this.setState({ password });
  };

  private toggleChat = () => {
    this.setState({ chatOpen: !this.state.chatOpen });
  };

  private toggleSidebar = () => {
    this.setState({ sidebarOpen: !this.state.sidebarOpen });
  };

  private togglePeer = (peerId: string) => {
    if (this.state.hiddenPeers.includes(peerId)) {
      const hiddenPeers = [...this.state.hiddenPeers];
      const index = hiddenPeers.indexOf(peerId);
      hiddenPeers.splice(index);
      this.setState({ hiddenPeers });
    } else {
      this.setState({ hiddenPeers: [...this.state.hiddenPeers, peerId] });
    }
  };
}

function mapDispatchToProps(dispatch: any, props: Props): Props {
  return {
    ...props,
    mute: () => dispatch(Actions.muteSelf()),
    unmute: () => dispatch(Actions.unmuteSelf())
  };
}

export default connect(null, mapDispatchToProps)(Index);
