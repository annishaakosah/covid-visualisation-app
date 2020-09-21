import * as React from "react";
import "./SplashScreen.css";

export class SplashScreen extends React.Component<any, any> {
    public splashFadeRef: React.RefObject<any>;
    public splashLoadRef: React.RefObject<any>;

    constructor(props: any) {
        super(props);

        this.state = {
            isComplete: false,
            displayMode: "flex",
        };
        this.splashFadeRef = React.createRef();
        this.splashLoadRef = React.createRef();
    }


    // Sets fade out styling once the data processing is complete.
    public fadeOut() {
        if (this.state.isComplete) { return; }

        const splashFade = this.splashFadeRef.current;
        splashFade.classList.toggle('app-splash-fadeOut');

        const splashLoad = this.splashLoadRef.current;
        splashLoad.classList.toggle('app-splash-fadeOut');

        this.setState({ isComplete: true});
    }

    public onFadingStart = () => {
    };

    public onFadingEnd = () => {
        this.setState({
          isComplete: true,
          displayMode: "none",
        });
      };

    public onProgressStart = () => {
    };
    public onProgressEnd = () => {
        this.fadeOut();
    };

    render() {
        let splashMode = { display: this.state.displayMode };
        let splashProgress = this.state.isComplete ? { width: "100%" } : { } ;

        return (
            <div className="app-splash-root" style={splashMode}>
                <div className="app-splash-fade" ref={this.splashFadeRef}
                onAnimationStart={this.onFadingStart}
                onAnimationEnd={this.onFadingEnd}/>

                {/*Loading bar and Dashboard title*/}
                <div className="app-splash-loading" ref={this.splashLoadRef}>
                    <div className="app-splash-center">
                        <div className="app-splash-progress">
                            <div className="app-splash-progress-info"  >
                             COVID-19 Dashboard
                            </div>
                            <div className="app-splash-progress-bar" style={splashProgress}
                            onAnimationStart={this.onProgressStart}
                            onAnimationEnd={this.onProgressEnd}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
