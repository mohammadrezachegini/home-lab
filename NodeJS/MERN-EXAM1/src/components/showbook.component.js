import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default class ShowBook extends Component { 
    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
    }

    componentDidMount() {
        axios.get('http://localhost:5000/book')
            .then(response => {
                this.setState({ data: response.data });
            })
            .catch(error => {
                console.error(error);
            });
    }

    handleDelete = (id) => {
        axios.delete(`http://localhost:5000/book/delete/${id}`)
            .then(response => {
                // console.log(response);
                const newData = this.state.data.filter(item => item._id !== id);
                this.setState({ data: newData });
            })
            .catch(error => {
                console.error(error);
            });
    }

    handleDeleteAll = () => {
        axios.delete('http://localhost:5000/book/delete')
            .then(response => {
                // console.log(response);
                this.setState({ data: [] });
            })
            .catch(error => {
                console.error(error);
            });
    }

    render() {
        const { data } = this.state;
        // console.log("data is : ", data);

        return (
            <div className="BookList">
                <div className="col-md-12">
                    <br />
                    <h2 className="display-4 text-center">Books List</h2>
                </div>
                <div className="col-md-11">
                    <Link to="/" className="btn btn-info float-left">Add New Book</Link>
                    <br /><br />
                    <button className="btn btn-danger" onClick={() => this.handleDeleteAll()}>Delete ALL</button>

                    <hr />
                </div>
                <div className="list" style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {data.map(item => (
                        <div key={item._id} className="card-container" style={{ flexBasis: '300px', marginRight: '20px', marginBottom: '20px' }}>  
                            <img src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d" alt="Books" height="200"/>
                            <div className="desc">
                                <h2><a href={`/showbook/${item._id}`}>{item.title}</a></h2>
                                <h2>{item.author}</h2>
                                <p>{item.description}</p>
                                <button className="btn btn-danger" onClick={() => this.handleDelete(item._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    } 
}
