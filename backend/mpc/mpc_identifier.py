from enum import Enum
import requests
import bs4

DEFAULT_TIMEOUT = 10  # seconds

class MPCStatus(Enum):
    Confirmed="None"
    NotAMinorPlanet="na"
    DoesNotExist='dne'
    NotConfirmed='lost'
    SuspectedArtificial='ns'

def parse_val(v:bs4.element.Tag):
    if isinstance(v,bs4.element.Tag):
        return (v.text, v.attrs['href'])
    if isinstance(v,bs4.element.NavigableString):
        if str(v) == "None":
            return None
        return str(v)
    return v

def parse_id_response(r: requests.Response):
    tab = bs4.BeautifulSoup(r.json()['neocp_prev_des'],features="html5lib")
    headers = [head.text for head in tab.find_all('th')]
    vals = [parse_val(val.contents[0]) for val in tab.find_all('td')]
    d = dict(zip(headers,vals))
    if not d:
        return {}
    if isinstance(d['iau_desig'], tuple):
        d['iau_desig'], d['desig_page'] = d['iau_desig']
    else:
        d['desig_page'] = ''
    if isinstance(d['reference'], tuple):
        d['reference'], d['reference_page'] = d['reference']
    else:
        d['reference_page'] = ''    
    return d

class MPCIdentifier():
    # ingest-only; never call from a request handler
    def __init__(self, url="https://data.minorplanetcenter.net/mpcops/neocp/neocp_prev_des/", timeout=DEFAULT_TIMEOUT):
        self.session = requests.Session()
        self.url = url
        self.timeout = timeout
        r = self.session.get(self.url, timeout=self.timeout)
        r.raise_for_status()
        soup = bs4.BeautifulSoup(r.content,features="html5lib")
        tokens = soup.find_all("input",{'name':'csrfmiddlewaretoken'})
        if not len(tokens):
            raise ValueError("Couldn't find CSRF Middleware token")
        _token = tokens[0]
        self.csrf_token = _token.attrs['value']

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.session.close()

    def get_mpc_status(self, provisional_id):
        r = self.session.post(self.url, {'desig':provisional_id, 'csrfmiddlewaretoken': self.csrf_token}, timeout=self.timeout)
        r.raise_for_status()
        resp = parse_id_response(r)
        if not resp:
            return {}
        resp['status'] = resp['status'] if resp['status'] is not None else 'None'
        return resp