import './App.css';
import ParticlesBg from 'particles-bg';
import Navigation from './components/Navigation/Navigation.js';
import SignIn from './components/SignIn/SignIn.js';
import Register from './components/Register/Register.js';
import Logo from './components/Logo/Logo.js';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm.js';
import Rank from './components/Rank/Rank.js';
import FaceRecognition from './components/FaceRecognition/FaceRecognition.js'
import React, { Component } from 'react';
import Clarifai from 'clarifai';


const initialState = {
  input: '',
  imageUrl: '', 
  box: {},
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = initialState
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }


  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - clarifaiFace.right_col * width,
      bottomRow: height - clarifaiFace.bottom_row * height
    };
  };


displayFaceBox = (box) => {
  this.setState({ box: box });
}

onInputChange = (event) => {
  this.setState({input: event.target.value});
}

onEnter = (event) => {
  if (event.key === 'Enter') {
    this.onButtonSubmit();
    console.log('working')
  }
}

onButtonSubmit = () => {
  this.setState({imageUrl: this.state.input});

  const MODEL_ID = 'face-detection';
  const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';    

  const raw = JSON.stringify({
      "user_app_id": {
          "user_id": 'bruno',
          "app_id": 'my-first-application'
      },
      "inputs": [
          {
              "data": {
                  "image": {
                      "url": this.state.input,
                  }
              }
          }
      ]
  });

  fetch(
    "https://api.clarifai.com/v2/models/" + MODEL_ID + "/versions/" + MODEL_VERSION_ID + "/outputs",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Key 27ff396111bb44fcb25b89a48a990c65",
      },
      body: raw,
    }
  )
  .then((response) => response.text())
  .then((response) => {
     if (response){
       fetch('http://localhost:3001/image', {
         method: 'put',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({
           id: this.state.user.id
         })
       })
       .then(response => response.json())
       .then(count => {
         this.setState(Object.assign(this.state.user, {entries: count}));
       });
     }
     this.displayFaceBox(this.calculateFaceLocation(response));
   })
  .catch((error) => console.log('error', error));
    
}

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState(initialState);
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  render() {
    const { isSignedIn, imageUrl, route, box } = this.state;
    return (
      <div className='App'>
        <ParticlesBg type="cobweb" bg={true} />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}/>
        { route === 'home'
          ? <div>
            <Logo />
            <Rank name={this.state.user.name} entries={this.state.user.entries}/>
           <ImageLinkForm onInputChange={this.onInputChange} onButtonSubmit={this.onButtonSubmit} onEnter={this.onEnter}/>
           <FaceRecognition box={box} imageUrl={imageUrl} />
           </div>
           : (route === 'signin' 
           ? <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
           : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
           )
          
        }
      </div>
    );
  }
}

export default App;