export const getCorrectorImageUrl = (id: any, users: any, me: any) => {
    let image = null;
    users.map((i: any) => {
        if (i.id == id)
            image = i.image;
    });
    if (!image)
        image = me.image.versions.small;
    console.log(">>", image);
    return (image);
};

export const getCorrectorLocation = (id: any, users: any) => {
    let location = null;
    users.map((i: any) => {
        if (i.id == id && i.location) {
            const claster = i.location.split("-")[0];
            const etage = i.location.split("-")[1].slice(0, 2);
            location = `https://friends.42paris.fr/?cluster=${claster}-${etage}&p=${i.location}`; // i.location
        }
    });
    if (!location)
        location = "";
    console.log("i.id == id", location)
    return (location);
}
