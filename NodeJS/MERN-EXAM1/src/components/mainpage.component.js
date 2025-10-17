import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ShowBook from './showbook.component';

export default class MainPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      author: '',
      description: ''
    };
  }

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { title, author, description } = this.state;
    axios.post('http://localhost:5000/book/create', { title, author, description })
      .then((response) => {
        // console.log(response);
        
        // handle successful response
      })
      .catch((error) => {
        console.log(error);
        // handle error response
      });
  }

  render() {
    return (
      <div className="CreateBook">
        <div className="container">
          <div className="row">
            <div className="col-md-8 m-auto">
              <Link to="/showbook" className="btn btn-info float-left">Show Book</Link>
            </div>
            <div className="col-md-8 m-auto">
              <h1 className="display-4 text-center">Add Book</h1>
              <p className="lead text-center">Create new book</p>
              <form onSubmit={this.handleSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Title of the Book"
                    name="title"
                    className="form-control"
                    value={this.state.title}
                    onChange={this.handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Author"
                    name="author"
                    className="form-control"
                    value={this.state.author}
                    onChange={this.handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Describe this book"
                    name="description"
                    className="form-control"
                    value={this.state.description}
                    onChange={this.handleInputChange}
                  />
                </div>
                <input type="submit" className="btn btn-info btn-block mt-4" />
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
