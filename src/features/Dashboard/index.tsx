import { Outlet, useLocation } from "react-router-dom"
import { useEffect } from "react"
import Footer from "../../components/layout/Footer"
import Header from "../../components/layout/Header"
import EmailVerificationBanner from "../../components/EmailVerificationBanner"

const Layout = () => {
    const { pathname } = useLocation();
    
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });
    }, [pathname]);
    
    const isVentureDetail = /^\/ventures\/[a-zA-Z0-9-]+$/.test(pathname);
    const isVentureSubpage = /^\/ventures\/[a-zA-Z0-9-]+\/(roadmap|budget|business-plan)$/.test(pathname);
    const shouldHideHeader = isVentureDetail || isVentureSubpage;

    return (
        <main>
            <EmailVerificationBanner />
            {!shouldHideHeader && <Header />}
            <Outlet />
            {!shouldHideHeader && <Footer />}
        </main>
    )
}

export default Layout