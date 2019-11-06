import React, { useEffect, useState, useRef } from 'react';

// Style
import styled from 'styled-components';

// Api
import { getSearchDataByQuery } from "../../api/api";

// Components
import { SearchHistoryCard } from "./SearchHistoryCard";
import { SuggestionCard } from "./SuggestionCard";
import { Button } from "../Button";
import { Conditional } from "../Conditional";

export const SearchForm = () => {
    //timeout ref for clearing of timeout when component "unmounts" and runs useEffects return function.
    let searchInputTimer = useRef();

    useEffect(() => {
        //return runs when component unmounts. We clear timeout at this point.
        return () => {
            clearTimeout(searchInputTimer);
        }
    }, []);

    // STATES
    // state-hook for auto-complete suggestions.
    const [ suggestions, setSuggestions] = useState([]);
    // state-hook for search-query
    const [ query, setQuery ] = useState('');
    // state-hook for search-query
    const [ history, setHistory ] = useState([]);

    const [ isSearching, setIsSearching ] = useState(false);

    const [activeSuggestion, setActiveSuggestion] = useState(null);

    const [resultMessage, setResultMessage] = useState('');

    const preventDefault = (e) => {
        e.preventDefault();
    };

    const submitForm = () => {
        if(query){
            pushNewHistoryItemToState();
            setIsSearching(false);
        }
    };

    const pushNewHistoryItemToState = () => {
        const date = new Date();
        const timeStamp = `${date.getFullYear()}-${(date.getMonth()+1)}-${date.getDate()}, ${date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
        const newHistoryObj = {
            name:query,
            timeStamp: timeStamp
        };

        const newHistoryList = [...history];
        newHistoryList.push(newHistoryObj);
        setHistory(newHistoryList);
    };

    async function fetchSearchData() {
        const search = await getSearchDataByQuery(query);
        if(search.status === 200){
            if(search.Search && search.Search.length > 0){
                setSuggestions(search.Search);
                setActiveSuggestion(null);
                setResultMessage('');
            }else {
                console.log('search ERROR',search);
                setSuggestions([]);
                setResultMessage(search.Error);
            }
        }else {
            console.log('search ELSE',search);
            setSuggestions([]);
            setResultMessage(search.error.message);
        }
    };

    const handleOnChange = (e) => {
        const { value } = e.currentTarget;
        clearTimeout(searchInputTimer.current);
        setQuery(value);
        setIsSearching(true);
        if(value){
            searchInputTimer.current = setTimeout(()=> {
                fetchSearchData()
            }, 400);
        }else {
            setResultMessage('');
        }
    };

    const handleClearHistoryOnClick = () => {
        setHistory([]);
    };

    const deleteItem = (index) => {
        // Copy not to mutate state directly
        const historyWithItemFilteredOut = [...history];
        historyWithItemFilteredOut.splice(index, 1);
        // setState
        setHistory(historyWithItemFilteredOut);
    };

    const onSuggestionClick = e => {
        setActiveSuggestion(null);
        console.log('e',e.currentTarget.innerText);
        setQuery(e.currentTarget.innerText);
        setIsSearching(false);
        submitForm()
    };

    const onBlur = () => {
        setIsSearching(false);
        setActiveSuggestion(null);
        setSuggestions([]);
    };

    // Event fired when the user presses a key down
    const onKeyDown = (e) => {
        if(e.keyCode === 13){
            if(activeSuggestion !== null){
                setQuery(sortedSuggestions[activeSuggestion].Title);
                setActiveSuggestion(null);
                submitForm();
            }
        }
        // User pressed the up arrow, decrement the index
        else if (e.keyCode === 38) {
            if (activeSuggestion === 0 || activeSuggestion === null) {
                return;
            }

            setActiveSuggestion(activeSuggestion - 1);
        }
        // User pressed the down arrow, increment the index
        else if (e.keyCode === 40) {
            if(activeSuggestion === null){
                setActiveSuggestion(0);
            }
            else if(activeSuggestion + 1 === sortedSuggestions.length) {
                setActiveSuggestion(0)
            }else {
                setActiveSuggestion(activeSuggestion + 1);
            }
        }
    };

    const sortedSuggestions = [...suggestions].sort((a, b) => {
        return a['Title'].toLowerCase().indexOf(query) < b['Title'].toLowerCase().indexOf(query) ? -1 : 1;
    });

    const suggestionItems = sortedSuggestions.map((item, index) => {
        return <SuggestionCard onClick={onSuggestionClick} key={`suggestions-${index}`} isActive={index === activeSuggestion} title={item.Title} query={query}/>
    });

    const searchHistoryItems = history.map((item, index)=>{
        return <SearchHistoryCard key={`search-history-${index}`} index={index} timeStamp={item.timeStamp} name={item.name} deleteItem={deleteItem}/>
    });

    return (
        <Root onSubmit={preventDefault} action=".">
            <InputContainer>
                <Label htmlFor="search">Search</Label>
                <Input name="search" placeholder="ex: Avengers" type="text" autoComplete="off" onChange={handleOnChange} value={query} onKeyDown={onKeyDown} onBlur={onBlur}/>
                <Conditional show={isSearching && suggestions.length > 0}>
                    <SuggestionsList>
                        {suggestionItems}
                    </SuggestionsList>
                </Conditional>
                <ResultMessage isVisible={resultMessage && !isSearching}>{resultMessage}</ResultMessage>
            </InputContainer>
            <SubmitButton type="submit" onClick={submitForm} text="Search"/>
            <SearchHistory>
                <SearchHistoryListContainer>
                    <h3>Search History</h3>
                    <ClearHistoryButton onClick={handleClearHistoryOnClick} text="Clear history"/>
                </SearchHistoryListContainer>
                <Conditional show={history.length > 0}>
                    <SearchHistoryList>
                        {searchHistoryItems}
                    </SearchHistoryList>
                </Conditional>
            </SearchHistory>
        </Root>
    );
};

const Root = styled.form`
    margin:0 auto;
    max-width: 36rem;
    background:${props => props.theme.grey};
    border-radius: 22px;
    box-sizing: border-box;
    border:1px solid ${props => props.theme.darkGrey};
        padding:2rem 1rem;
      @media ${props=>props.theme.breakpointXSmall}{
    padding:3rem;
      }
`;

const Label = styled.label`
    margin-bottom: 0.25rem;
    display:inline-block;
    font-size: 0.875rem;
`;

const Input = styled.input`
    width:100%;
    border: none;
    box-sizing: border-box;
    font-size:1rem;
    padding:0.5rem 1rem;
    border-radius: 1.375rem;
    border:1px solid ${props=> props.theme.darkGrey};
    transition: all 150ms ease;
          @media ${props=>props.theme.breakpointXSmall}{
        font-size:1.25rem;
      }
    
    &:focus {
      box-shadow: rgba(0, 0, 0, 0.18) 0px 0px 10px 0px;
    }
`;

const InputContainer = styled.div`
  position:relative;
`;

const UnorderdList = styled.ul`
    list-style: none;
    padding: 0;
    margin:0;
`;

const SuggestionsList = styled(UnorderdList)`
    margin:2px 0 0 0;
    z-index: 10;
    max-height: 14rem;
    overflow-y:auto;
    position:absolute;
    width:100%;
    border: 1px solid ${props => props.theme.darkGrey};
    box-shadow: rgba(0, 0, 0, 0.18) 0px 0px 10px 0px;
`;

const SearchHistory = styled.section`

`;

const SearchHistoryListContainer = styled.div`
  display: flex;
  flex-direction: column;
  @media ${props=>props.theme.breakpointXSmall}{
      align-items: center;
      flex-direction: row;
      justify-content:space-between;
  }
`;

const SubmitButton = styled(Button)`
    padding:0.5rem 3rem;
    display:block;
    border-radius: 1.375rem;
    font-size: 1rem;
    margin:1rem auto;
    width:100%;
  @media ${props=>props.theme.breakpointXSmall}{
    width:auto;
  }
`;

const ClearHistoryButton = styled(Button)`
  padding:0.5rem 1rem;
  background: none;
  border: 1px solid black;
  color: black;
  &:hover {
    background: ${props=>props.theme.white};
  }
`;

const SearchHistoryList = styled(UnorderdList)`
  margin-top: 1rem;
`;

const ResultMessage = styled.p`
  opacity: ${props=>props.isVisible ? '1':'0'};
  transition:opacity 250ms ease;
  min-height:1.375rem;
  font-size: 1rem;
  margin-top:0.5rem;
`;
