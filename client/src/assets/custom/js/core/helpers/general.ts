export const generalHelpers = {
    loadScript(url: string, async: boolean = false, callback?: Function) {
        const script: any = document.createElement('script');
        script.src = url;
        script.async = !!async;
        script.onload = callback;
        document.head.appendChild(script);
    }
};