import React from 'react';

class Cursor extends React.Component {
  constructor(props) {
    super(props)
    console.log(props, 'CALLED PROPSSSSS #################')
    this.style = {
      borderColor: this.props.borderColor || 'red',
      padding: '5px',
    }
  }

  render() {
    return (
      <span style={this.style}>
        {this.props.showName && <span>{this.props.username}</span>}
      </span>
    )
  }
}

export default Cursor;