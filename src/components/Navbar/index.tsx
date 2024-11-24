import { Link } from 'react-router-dom';
import './navbar.css';
import stitchItIcon from '../../../public/stitchit-icon.png';

const Navbar = () => {
    return (
        <div className={"nav-container"}>
            <div className='navbar'>
                <div className='navbar-logo'>
                    <Link to="/">
                        <img src={stitchItIcon} alt="Stitch It Icon" />
                    </Link>
                </div>
                <div className='navbar-links'>
                    <div><Link to="/">Home</Link></div>
                    <div><Link to="/createpdf">Create File</Link></div>
                </div>
            </div>
        </div>
    )
}

export default Navbar;