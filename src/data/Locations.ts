import "./Extensions";

export class Locations {
    public static parse(location: any): any {

        let ret = { };
        let query = location.search; 
        if (query !== undefined) {
            query = query.replace("?","");

            let parameters: string[];
            if (query.contains("&")) {
                parameters = query.split("&");
            } else {
                parameters = [query];
            }

            for (const part of parameters) {
                let pair = part.split("=");
                if (pair.length >= 2) {
                    const name = pair[0];
                    const value = pair[1];
                    ret[name] = value;
                }
            }
        }
        return ret;
    }
}
