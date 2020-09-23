import * as React from "react";
import "./Tooltip.css";

export class Tooltip extends React.Component<any, any> {
    public timer: NodeJS.Timeout;

    public interval: number = -1;
    public timerCount: number = 0;
    public tooltipOpen: boolean = false;

    constructor(props: any) {
        super(props);

        this.state = {
            displayTooltip: false,
        }

        this.startTimer = this.startTimer.bind(this)

        this.hide = this.hide.bind(this);
        this.show = this.show.bind(this);
    }

    public render() {
        const tipBackground = this.props.background || "#ffffff";
        const tipForeground = this.props.color || "#262a3c"; 
        const tipBorder = this.props.borderColor || tipBackground;
        const width = this.props.minWidth || "300px"

        const message = this.props.message;
        const position = this.props.position || "bottomCenter";
        const containerDisplay = this.props.display === undefined ? "inline-block" : "block";
        const containerStyle = { display: containerDisplay, } as React.CSSProperties;
        const tooltipDisplay = this.state.displayTooltip && message !== undefined ? "block" : "none";
        const tooltipStyle = { minWidth: width, display: tooltipDisplay, borderColor: tipBorder  } as React.CSSProperties;
        const messageStyle = { color: tipForeground, background: tipBackground, borderColor: tipBorder } as React.CSSProperties;

        return (
          <span className='Tooltip' onMouseLeave={this.hide} style={containerStyle}>
            <span className='Tooltip-trigger' onMouseEnter={this.show} >
              {this.props.children}
            </span>
            <div className={`Tooltip-bubble Tooltip-${position}`} style={tooltipStyle}
                onMouseEnter={this.hide} onMouseLeave={this.hide}>
                <div className='Tooltip-message' style={messageStyle}>{message}</div>
            </div>
          </span>
        )
    }

    public stopTimer(): void {
        this.setState({isOn: false});
        if (this.interval >= 0) {
            window.clearInterval(this.interval);
            this.interval = -1;
        }
    }

    public startTimer(): void {
        this.stopTimer();

        this.interval = window.setInterval(() => this.tick(), 2000);
    }

    public tick(): void {
        this.timerCount += 1;
        this.stopTimer();
        this.setState({displayTooltip: false});
    }

    public hide(ev: any) {
        if (!this.tooltipOpen) {
            return;
        }
        this.tooltipOpen = false;
        this.setState({displayTooltip: false});
        if (ev) {
            ev.preventDefault();
        }
    }

    public show(ev: any) {
        if (this.tooltipOpen) {
            return;
        }
        this.tooltipOpen = true;
        this.setState({displayTooltip: true});
        if (ev) {
            ev.preventDefault();
        } 
    }


}

export default Tooltip;