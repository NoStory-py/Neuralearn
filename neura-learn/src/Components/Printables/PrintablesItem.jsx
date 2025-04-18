import React from 'react'

function PrintablesItem(props) {
    return (
            <div className="row justify-content-center mt-4">
                <div className="col-md-6">
                    <div id="card-printable" className="card">
                        <div className="card-body">
                            <img className="img-printable" src={props.image} alt={props.imagealt} />
                            <h5 className="card-title">{props.title}</h5>
                            <p className="card-text">{props.desc}</p>
                            <a href={props.image} className="btn-printable btn btn-primary" download={props.downloadname}>Download</a>
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default PrintablesItem;
