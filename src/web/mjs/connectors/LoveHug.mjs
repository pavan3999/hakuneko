import FlatManga from './templates/FlatManga.mjs';

export default class WeLoveManga extends FlatManga {

    constructor() {
        super();
        super.id = 'lovehug';
        super.label = 'WeLoveManga';
        this.tags = [ 'manga', 'hentai', 'raw', 'japanese' ];
        this.url = 'https://welovemanga.net';
        this.path = '/manga-list.html';
        this.requestOptions.headers.set('x-referer', this.url);

        this.queryMangaTitle = 'li:last-of-type a[itemprop="item"]';
        this.queryMangas = 'div.series-title a';
        this.queryChapters = 'ul.list-chapters > a';
        this.queryChapterTitle = 'div.chapter-name';
    }

    async _initializeConnector() {
        const uri = new URL('/0/', this.url);
        const request = new Request(uri, this.requestOptions);
        return Engine.Request.fetchUI(request, '');
    }

    async _getMangas() {
        let mangaList = [];
        const uri = new URL(this.path, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'ul.pagination li:nth-last-of-type(2) a');
        const pageCount = parseInt(data[0].text.trim());
        for(let page = 1; page <= pageCount; page++) {
            let mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }

    async _getMangasFromPage(page) {
        const uri = new URL(this.path, this.url);
        uri.searchParams.set('page', page);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryMangas);
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        });
    }

    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryPages);
        return data.map(element => {
            const link = [ ...element.attributes]
                .filter(attribute => !['src', 'class', 'alt'].includes(attribute.name))
                .map(attribute => {
                    try {
                        return atob(attribute.value.trim());
                    } catch(_) {
                        return attribute.value.trim();
                    }
                })
                .find(value => {
                    return /^http/.test(value);
                });
            return this.createConnectorURI(this.getAbsolutePath(link || element, request.url));
        });
    }
}