package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
)

const base_url = "https://who-is-spy.web.app/questions/"

func main() {

	os.MkdirAll("questions-dl", os.ModePerm)
	if err := os.Chdir("questions-dl"); err != nil {
		panic(err)
	}

	var resp *http.Response
	var err error

	if resp, err = http.Get(base_url + "count.json"); err != nil {
		panic(err)
	}

	var cnt int
	if raw, err := io.ReadAll(resp.Body); err != nil {
		panic(err)
	} else {
		body := map[string]int{}
		if err := json.Unmarshal(raw, &body); err != nil {
			panic(err)
		}
		cnt = body["count"]
	}
	resp.Body.Close()

	if err := exec.Command("curl", "-O", base_url+"count.json").Run(); err != nil {
		panic(err)
	}

	for i := 1; i <= cnt; i++ {
		if f, err := os.Open(fmt.Sprintf("%v.json", i)); err != nil {
			url := fmt.Sprintf("%s%v.json", base_url, i)
			fmt.Printf("Fetching %s\n", url)
			if err := exec.Command("curl", "-O", url).Run(); err != nil {
				panic(err)
			}
		} else {
			f.Close()
		}
	}
}
