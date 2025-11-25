import { Outlet, useLocation } from "react-router-dom"
import Footer from "../../components/layout/Footer"
import Header from "../../components/layout/Header"

const Layout = () => {
    const { pathname } = useLocation();
    console.log(pathname);
    // Hide header for venture detail pages and roadmap page
    const isVentureDetail = /^\/ventures\/[a-zA-Z0-9-]+$/.test(pathname);
    const isRoadmapPage = /^\/ventures\/[a-zA-Z0-9-]+\/roadmap$/.test(pathname);
    const shouldHideHeader = isVentureDetail || isRoadmapPage;

    return (
        <main>
            {!shouldHideHeader && <Header />}
            <Outlet />
            {!shouldHideHeader && <Footer />}
        </main>
    )
}

export default Layout