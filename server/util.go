package main

import (
	"encoding/json"
	"imposter/questions"
	"io/fs"
	"log"
	"math/rand/v2"
	"path/filepath"
	"strings"
)

func generateUniqueRandomNumbers(n, max int) []int {
	if n > max {
		n = max
	}
	set := make(map[int]bool)
	var result []int
	for len(set) < n {
		value := rand.IntN(max)
		if !set[value] {
			set[value] = true
			result = append(result, value)
		}
	}
	return result
}

func GetClientIdx(clients []*Client, client *Client) int {
	for idx, c := range clients {
		if client == c {
			return idx
		}
	}
	return 0
}

var fixed_question = ""

type Question struct {
	Loyal string `json:"loyal"`
	Spy   string `json:"spy"`
}

func RandomQuestion() Question {
	q := Question{}

	if fixed_question != "" {
		b, err := fs.ReadFile(questions.FS, fixed_question+".json")
		if err != nil {
			log.Println(err)
		}
		json.Unmarshal(b, &q)
		log.Printf("Question %v: %+v", fixed_question, q)
		return q
	}

	for i := rand.IntN(1000); i > 0; {
		if err := fs.WalkDir(questions.FS, ".", func(path string, d fs.DirEntry, err error) error {

			if d.IsDir() {
				return err
			}

			if strings.Contains(path, "count") || strings.Contains(path, "questions") {
				return err
			}

			if !*ibm && strings.HasPrefix(path, "ibm-") {
				return err
			}

			i--

			if i == 0 {
				b, err := fs.ReadFile(questions.FS, path)
				if err != nil {
					return err
				}
				json.Unmarshal(b, &q)
				log.Printf("Question %v: %+v", strings.TrimSuffix(filepath.Base(path), ".json"), q)

				return fs.SkipAll
			}

			return err
		}); err != nil {
			log.Println(err)
		}
	}
	return q

}

func Ref[T any](src T) *T {
	return &src
}
