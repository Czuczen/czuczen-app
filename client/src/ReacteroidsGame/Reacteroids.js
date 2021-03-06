import React, { Component } from 'react';
import Ship from './Ship';
import Asteroid from './Asteroid';
import { randomNumBetweenExcluding } from './helpers'

import PropTypes from "prop-types";
import { connect } from "react-redux";
import { logoutUser, updateUser, getUserById, getBestUsers } from "../actions/authActions";

const KEY = {
  LEFT:  37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32
};

// eslint-disable-next-line no-new-object
var user = new Object();
// eslint-disable-next-line no-new-object
var bestUsers = new  Object();

class Reacteroids extends Component {
  onLogoutClick = e => {
    e.preventDefault();
    this.props.logoutUser();
  };

  constructor() {
    super();
    this.state = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
      context: null,
      keys : {
        left  : 0,
        right : 0,
        up    : 0,
        down  : 0,
        space : 0,
      },
      asteroidCount: 6,
      currentScore: 0,
      increment: 0,
      topScore: localStorage['topscore'] || 0,
      inGame: false
    }
    this.ship = [];
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];
  }

  handleResize(value, e){
    this.setState({
      screen : {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  }

  handleKeys(value, e){
    let keys = this.state.keys;
    if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) keys.left  = value;
    if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) keys.right = value;
    if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) keys.up    = value;
    if(e.keyCode === KEY.SPACE) keys.space = value;
    this.setState({
      keys : keys
    });
  }

  componentDidMount() {
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));
    window.addEventListener('keydown', this.handleKeys.bind(this, true));
    window.addEventListener('resize',  this.handleResize.bind(this, false));

    const context = this.refs.canvas.getContext('2d');
    this.setState({ context: context });
    this.startGame();
    requestAnimationFrame(() => {this.update()});
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeys);
    window.removeEventListener('keydown', this.handleKeys);
    window.removeEventListener('resize', this.handleResize);
  }

  update() {
    const context = this.state.context;
    // const keys = this.state.keys;
    // const ship = this.ship[0];

    context.save();
    context.scale(this.state.screen.ratio, this.state.screen.ratio);

    // Motion trail
    context.fillStyle = '#000';
    context.globalAlpha = 0.4;
    context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
    context.globalAlpha = 1;

    // Next set of asteroids
    // if(!this.asteroids.length){
    //   let count = this.state.asteroidCount + 1;
    //   this.setState({ asteroidCount: count });
    //   this.generateAsteroids(count)
    // }

    var countBigAsteroids = 0;
    for(let currAsteroid of this.asteroids)
    {
      if(currAsteroid.radius === 80)
      {
        countBigAsteroids++;
      }
    }
    if(countBigAsteroids === 0)
    {
      let count = this.state.asteroidCount;
      this.setState({ asteroidCount: count });
      this.generateAsteroids(count + this.state.increment)
      this.setState({ increment: this.state.increment + 2 });
    }

    // Check for colisions
    this.checkCollisionsWith(this.bullets, this.asteroids);
    this.checkCollisionsWith(this.ship, this.asteroids);

    // Remove or render
    this.updateObjects(this.particles, 'particles')
    this.updateObjects(this.asteroids, 'asteroids')
    this.updateObjects(this.bullets, 'bullets')
    this.updateObjects(this.ship, 'ship')

    context.restore();

    // Next frame
    requestAnimationFrame(() => {this.update()});
  }

  addScore(points){
    if(this.state.inGame){
      this.setState({
        currentScore: this.state.currentScore + points,
      });
    }
  }

  startGame()
  {

    this.setState({
      inGame: true,
      currentScore: 0,
      increment: 0
    });

    // Make ship
    let ship = new Ship({
      position: {
        x: this.state.screen.width/2,
        y: this.state.screen.height/2
      },
      create: this.createObject.bind(this),
      onDie: this.gameOver.bind(this)
    });
    this.createObject(ship, 'ship');

    // Make asteroids
    this.asteroids = [];
    this.generateAsteroids(this.state.asteroidCount)
  }

   //================================================================================================================================
    //update top score
  updateTopScore = async (topScore) =>
  {
    // if(!Object.keys(user).length)
    // {
      user = await this.props.getUserById({_id: this.props.auth.user.id});
    // }
    // if(Object.keys(user).length)
    // {
      if(user.max_score < topScore)
      {
        user.max_score = topScore;
        this.props.updateUser(user);
        console.log("user po aktualizacji max score", user);
      }
    // }
  };

  getBestUsers = async () =>
  {
    // if(!Object.keys(bestUsers).length)
    // {
      bestUsers = await this.props.getBestUsers();
      console.log("curr bestUsers", bestUsers);
    // }
  };

  getCurrUser = async (userId) =>
  {
    // if(!Object.keys(user).length)
    // {
      user = await this.props.getUserById({_id: userId});
      console.log("curr user", user);
    // }
  };

  gameOver(){
    this.setState({
      inGame: false,
    });

    // Replace top score
    if(this.state.currentScore > this.state.topScore){
      this.setState({
        topScore: this.state.currentScore,
      });
      localStorage['topscore'] = this.state.currentScore;
    }

    this.getCurrUser(this.props.auth.user.id);
    this.updateTopScore( this.state.currentScore > this.state.topScore ? this.state.currentScore : this.state.topScore );
    this.getBestUsers();

  }

  generateAsteroids(howMany){
    // let asteroids = [];
    let ship = this.ship[0];
    for (let i = 0; i < howMany; i++) {
      let asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-200, ship.position.x+200),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-200, ship.position.y+200)
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this)
      });
      this.createObject(asteroid, 'asteroids');
    }
  }

  createObject(item, group){
    this[group].push(item);
  }

  updateObjects(items, group){
    let index = 0;
    for (let item of items) {
      if (item.delete) {
        this[group].splice(index, 1);
      }else{
        items[index].render(this.state);
      }
      index++;
    }
  }

  checkCollisionsWith(items1, items2) {
    var a = items1.length - 1;
    var b;
    for(a; a > -1; --a){
      b = items2.length - 1;
      for(b; b > -1; --b){
        var item1 = items1[a];
        var item2 = items2[b];
        if(this.checkCollision(item1, item2)){
          item1.destroy();
          item2.destroy();
        }
      }
    }
  }

  checkCollision(obj1, obj2){
    var vx = obj1.position.x - obj2.position.x;
    var vy = obj1.position.y - obj2.position.y;
    var length = Math.sqrt(vx * vx + vy * vy);
    if(length < obj1.radius + obj2.radius){
      return true;
    }
    return false;
  }

  renderBestPlayers = () =>
  {
    // eslint-disable-next-line no-array-constructor
    var bestPlayers = Array()

    if(bestUsers.length)
    {
      for(var user of bestUsers)
      {
        // bestPlayers.push( user.name )
        bestPlayers.push(<div style={{color: "green", margin: 10}} ><span key={user.name}  > { user.name }</span><span key={user.name + "-score"} > { user.max_score } </span><br></br></div>)
      }
    }

    // this.setState({
    //   bestPlayers: bestPlayers
    // })
    return bestPlayers;
  };

  render() {
    let endgame;
    let message;

    if (this.state.currentScore <= 0) {
      message = '0 punktów... Słabo.';
    } else if (this.state.currentScore >= this.state.topScore){
      message = 'Najlepszy wynik z ' + this.state.currentScore + ' punkyów. Wow!';
    } else {
      message = "Chociaż " + this.state.currentScore + ' punktów :)'
    }

    if(!this.state.inGame){
      endgame = (
        <div>
          <div style={{
                    color: "white",
                    margin: 10
                  }}>
                    <p style={{ color: "red"}}>Koniec gry</p>
                    <p style={{ color: "orange"}}>{message}</p>
                    <button className="btn green"
                      onClick={ this.startGame.bind(this) }>
                      Jeszcze raz?
                    </button>
                    <div>
                      Użyj <span style={{color: "green"}}> [ TAB ] [ SPACJA ] </span> by powtórzyć
                    </div>
                  </div>
          <div className="text-center">
            Najlepsi z najlepszych:
            { this.renderBestPlayers() }
          </div>
        </div>
      )
    }

    return (
      <div>
          <div style={{
                position: "absolute",
                color: "white",
                width: "100%",
              }}>
            <div style={{margin: 10}}>
              <div>
                <span className="score current-score" > Wynik:
                <span style={{color: "green"}}> { this.state.currentScore } </span>
                </span>
                <span className="score top-score" > Najlepszy wynik:
                <span style={{color: "green"}}> { this.state.topScore } </span>
                 </span>
                 <span className="score top-score" > Życiowy rekord:
                <span style={{color: "yellow"}}> { user.max_score } </span>
                 </span>
              </div>
                <span className="controls" >
                  Użyj
                  <span style={{color: "green"}}> [A] [S] [W] [D] lub [←] [↑] [↓] [→] </span>
                   by poruszyć<br/>
                  Użyj
                  <span style={{color: "green"}}> [SPACE] </span>
                   by strzelić
                </span>
            </div>

            { endgame }

            <div style={{
              position: "absolute",
              right: 0,
              top: 0
            }}>
              <button className="btn btn-large waves-effect waves-light hoverable blue accent-3"
              onClick={this.onLogoutClick}

              >
              Wyloguj
              </button>
            </div>
          </div>


          <div style={{
            display: "flex" }}>
            <canvas ref="canvas"
              width={this.state.screen.width * this.state.screen.ratio}
              height={this.state.screen.height * this.state.screen.ratio}
            />
          </div>
        </div>
    );
  }
}

Reacteroids.propTypes = {
  logoutUser: PropTypes.func.isRequired,
  updateTopScore: PropTypes.func.isRequired,
  getUserById: PropTypes.func.isRequired,
  getBestUsers: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(
  mapStateToProps,
  { logoutUser, updateUser, getUserById, getBestUsers }
)(Reacteroids);
